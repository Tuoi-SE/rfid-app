import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { MobileQuickSubmitDto } from './dto/mobile-quick-submit.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ORDER_UPDATED_EVENT } from '@common/interfaces/scan.interface';
import { randomBytes } from 'crypto';
import { BusinessException } from '@common/exceptions/business.exception';
import { PaginationHelper } from '@common/helpers/pagination.helper';
import { OrderStatus, Prisma } from '.prisma/client';
import { OrderEntity } from './entities/order.entity';
import { OrderValidationService } from './order-validation.service';
import { OrderLocationService } from './order-location.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private orderValidation: OrderValidationService,
    private orderLocation: OrderLocationService,
  ) {}

  async create(createOrderDto: CreateOrderDto, user: { id: string; role: string; locationId?: string }) {
    const code = `${createOrderDto.type === 'INBOUND' ? 'IN' : 'OUT'}-${Date.now().toString().slice(-6)}-${randomBytes(2).toString('hex').toUpperCase()}`;

    // Resolve destination/location by order type.
    let mappedLocationId = createOrderDto.locationId;
    if (createOrderDto.type === 'INBOUND') {
      mappedLocationId = await this.orderValidation.validateInboundDestination(
        createOrderDto.locationId,
        user.role === 'WAREHOUSE_MANAGER' ? user.locationId : undefined,
      );
    } else if (createOrderDto.type === 'OUTBOUND') {
      mappedLocationId = await this.orderValidation.validateOutboundDestination(
        createOrderDto.locationId,
      );
    }

    if (user.role === 'WAREHOUSE_MANAGER') {
      const inboundAllowedIds = await this.orderLocation.getManagerInboundAllowedLocationIds(user.locationId);
      if (createOrderDto.type === 'INBOUND') {
        if (!mappedLocationId || !inboundAllowedIds.includes(mappedLocationId)) {
          throw new BusinessException(
            'Phiếu nhập kho chỉ được nhập về kho của manager hiện tại hoặc kho tổng.',
            'INBOUND_DESTINATION_FORBIDDEN',
            HttpStatus.FORBIDDEN,
          );
        }
      } else if (createOrderDto.type === 'OUTBOUND') {
        if (!user.locationId) {
          throw new BusinessException(
            'Tài khoản quản lý chưa được gán xưởng nguồn để tạo phiếu xuất kho.',
            'MANAGER_SOURCE_LOCATION_REQUIRED',
            HttpStatus.BAD_REQUEST,
          );
        }
        if (mappedLocationId === user.locationId) {
          throw new BusinessException(
            'Nơi xuất đến phải khác với vị trí hiện tại của xưởng.',
            'OUTBOUND_DESTINATION_SAME_AS_SOURCE',
            HttpStatus.BAD_REQUEST,
          );
        }
      }
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          code,
          type: createOrderDto.type,
          locationId: mappedLocationId,
          status: OrderStatus.PENDING,
          createdById: user.id,
          updatedById: user.id,
          items: {
            create: createOrderDto.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          },
        },
        include: {
          items: {
            include: { product: true },
          },
          location: true, createdBy: { select: { id: true, username: true, role: true } },
        },
      });
      return newOrder;
    });

    const entity = new OrderEntity(order as any);
    this.eventEmitter.emit(ORDER_UPDATED_EVENT, entity);
    return entity;
  }

  async findAll(
    query: QueryOrdersDto,
    user: { id: string; role: string; locationId?: string },
  ) {
    const { page = 1, limit = 20, search, type, status } = query;
    const where: Prisma.OrderWhereInput = { deletedAt: null };

    if (user.role === 'WAREHOUSE_MANAGER') {
      where.createdById = user.id;
    }

    if (search) {
      where.code = { contains: search, mode: 'insensitive' };
    }
    if (type) {
      where.type = type;
    }
    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          location: true, createdBy: { select: { id: true, username: true, role: true } },
          items: {
            include: { product: true },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    // Format progress
    const formattedData = data.map((order) => {
      const targetItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
      const scannedItems = order.items.reduce((sum, item) => sum + Math.min(item.scannedQuantity, item.quantity), 0);
      return new OrderEntity({
        ...order,
        progress: targetItems > 0 ? Math.round((scannedItems / targetItems) * 100) : 0,
      } as any);
    });

    return PaginationHelper.paginate(formattedData, total, page, limit);
  }

  async findOne(
    id: string,
    user: { id: string; role: string; locationId?: string },
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id, deletedAt: null },
      include: {
        location: true, createdBy: { select: { id: true, username: true, role: true } },
        items: {
          include: { product: true },
        },
        sessions: {
          include: { scans: true, user: { select: { id: true, username: true } } },
          orderBy: { startedAt: 'desc' },
        },
      },
    });

    if (!order) throw new BusinessException('Không tìm thấy đơn hàng', 'ORDER_NOT_FOUND', HttpStatus.NOT_FOUND);

    await this.orderValidation.ensureManagerCanAccessOrder(order, user);

    const targetItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const scannedItems = order.items.reduce((sum, item) => sum + Math.min(item.scannedQuantity, item.quantity), 0);

    return new OrderEntity({
      ...order,
      progress: targetItems > 0 ? Math.round((scannedItems / targetItems) * 100) : 0,
    } as any);
  }

  async update(id: string, updateOrderDto: any, user: { id: string; role: string; locationId?: string }) {
    if (user.role !== 'WAREHOUSE_MANAGER') {
      throw new BusinessException('Chỉ manager được chỉnh sửa phiếu kho.', 'ORDER_FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    const order = await this.prisma.order.findFirst({ where: { id, deletedAt: null } });
    if (!order) throw new BusinessException('Không tìm thấy đơn hàng', 'ORDER_NOT_FOUND', HttpStatus.NOT_FOUND);

    await this.orderValidation.ensureManagerCanAccessOrder(order, user);

    if (order.status !== OrderStatus.PENDING) {
      throw new BusinessException(`Không thể sửa đơn hàng đang ở trạng thái ${order.status}`, 'INVALID_STATUS_TRANSITION', HttpStatus.BAD_REQUEST);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // Delete old items
      if (updateOrderDto.items) {
        await tx.orderItem.deleteMany({ where: { orderId: id } });
      }

      const newOrder = await tx.order.update({
        where: { id },
        data: {
          ...(updateOrderDto.type ? { type: updateOrderDto.type } : {}),
          ...(updateOrderDto.locationId && user.role === 'ADMIN' ? { locationId: updateOrderDto.locationId } : {}),
          updatedById: user.id,
          ...(updateOrderDto.items ? {
            items: {
              create: updateOrderDto.items.map((item: any) => ({
                productId: item.productId,
                quantity: item.quantity,
              })),
            }
          } : {})
        },
        include: {
          items: { include: { product: true } },
          location: true, createdBy: { select: { id: true, username: true, role: true } },
        },
      });
      return newOrder;
    });

    const mapped = new OrderEntity(updated as any);
    this.eventEmitter.emit(ORDER_UPDATED_EVENT, mapped);
    return mapped;
  }

  async cancelOrder(id: string, user: { id: string; role: string; locationId?: string }) {
    if (user.role !== 'WAREHOUSE_MANAGER') {
      throw new BusinessException('Chỉ manager được huỷ phiếu kho.', 'ORDER_FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    const order = await this.prisma.order.findFirst({ where: { id, deletedAt: null } });
    if (!order) throw new BusinessException('Không tìm thấy đơn hàng', 'ORDER_NOT_FOUND', HttpStatus.NOT_FOUND);

    await this.orderValidation.ensureManagerCanAccessOrder(order, user);

    if (order.status !== OrderStatus.PENDING) {
      throw new BusinessException(`Không thể hủy đơn hàng đang ở trạng thái ${order.status}`, 'INVALID_STATUS_TRANSITION', HttpStatus.BAD_REQUEST);
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED, updatedById: user.id },
    });

    const mapped = new OrderEntity(updated);
    this.eventEmitter.emit(ORDER_UPDATED_EVENT, mapped);
    return mapped;
  }

  async remove(id: string, user: { id: string; role: string; locationId?: string }) {
    if (user.role !== 'WAREHOUSE_MANAGER') {
      throw new BusinessException('Chỉ manager được xoá phiếu kho.', 'ORDER_FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    const order = await this.prisma.order.findFirst({ where: { id, deletedAt: null } });
    if (!order) throw new BusinessException('Không tìm thấy đơn hàng', 'ORDER_NOT_FOUND', HttpStatus.NOT_FOUND);

    await this.orderValidation.ensureManagerCanAccessOrder(order, user);

    const updated = await this.prisma.order.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: user.id },
    });

    const mapped = new OrderEntity(updated);
    this.eventEmitter.emit(ORDER_UPDATED_EVENT, mapped);
    return mapped;
  }

  async mobileQuickSubmit(dto: MobileQuickSubmitDto, user: { id: string; role: string; locationId?: string }) {
    if (!['WAREHOUSE_MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      throw new BusinessException('Không có quyền tạo phiếu lưu động.', 'ORDER_FORBIDDEN', HttpStatus.FORBIDDEN);
    }
    if (!dto.epcs || dto.epcs.length === 0) {
      throw new BusinessException('Không có tag nào được quét.', 'EMPTY_TAGS', HttpStatus.BAD_REQUEST);
    }

    let mappedLocationId = dto.locationId;
    if (dto.type === 'INBOUND') {
      mappedLocationId = await this.orderValidation.validateInboundDestination(
        user.role === 'WAREHOUSE_MANAGER' ? user.locationId : dto.locationId,
      );
    } else if (dto.type === 'OUTBOUND') {
      mappedLocationId = await this.orderValidation.validateOutboundDestination(dto.locationId);
      if (user.role === 'WAREHOUSE_MANAGER') {
        if (!user.locationId) {
          throw new BusinessException('Tài khoản quản lý chưa được gán kho.', 'NO_LOCATION', HttpStatus.BAD_REQUEST);
        }
        if (mappedLocationId === user.locationId) {
          throw new BusinessException('Nơi xuất phải khác với kho hiện tại.', 'DESTINATION_SAME_AS_SOURCE', HttpStatus.BAD_REQUEST);
        }
      }
    }

    // 1. Fetch tags and validate
    const tags = await this.prisma.tag.findMany({
      where: { epc: { in: dto.epcs }, deletedAt: null },
      select: { id: true, epc: true, productId: true },
    });

    if (tags.length === 0) {
      throw new BusinessException('Tất cả EPC đều không tồn tại hoặc đã bị xóa.', 'INVALID_TAGS', HttpStatus.BAD_REQUEST);
    }

    // Group by product
    const productCounts: Record<string, number> = {};
    for (const tag of tags) {
      if (tag.productId) {
        productCounts[tag.productId] = (productCounts[tag.productId] || 0) + 1;
      }
    }

    const items = Object.entries(productCounts).map(([productId, quantity]) => ({ productId, quantity }));
    if (items.length === 0) {
      throw new BusinessException('Các dữ liệu thẻ quét được chưa được gán sản phẩm.', 'NO_VALID_PRODUCTS', HttpStatus.BAD_REQUEST);
    }

    const code = `${dto.type === 'INBOUND' ? 'IN' : 'OUT'}-M-${Date.now().toString().slice(-6)}-${randomBytes(2).toString('hex').toUpperCase()}`;

    // 2. Determine target status
    const { status: tagsToUpdateStatus, finalLocationId } = await this.orderLocation.determineTagStatusAndLocation(
      dto.type,
      mappedLocationId!,
    );

    // 3. Execute Transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          code,
          type: dto.type,
          locationId: mappedLocationId,
          status: OrderStatus.COMPLETED, // Instant completion
          createdById: user.id,
          updatedById: user.id,
          items: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              scannedQuantity: item.quantity, // Fully matched
            })),
          },
        },
        include: { items: { include: { product: true } }, location: true, createdBy: { select: { id: true, username: true, role: true } } },
      });

      const now = new Date();
      // Update Tags
      await tx.tag.updateMany({
        where: { epc: { in: tags.map(t => t.epc) } },
        data: {
          status: tagsToUpdateStatus,
          locationId: finalLocationId,
          lastSeenAt: now,
        }
      });

      // Create TagEvents
      const tagEvents = tags.map(tag => ({
        tagId: tag.id,
        type: dto.type === 'INBOUND' ? 'INBOUND' : 'OUTBOUND',
        description: `Tạo & quét nhanh qua Mobile (Phiếu: ${code})`,
        userId: user.id,
      }));
      // Workaround for TagEventType enums if they enforce specific strings
      await tx.tagEvent.createMany({
        data: tagEvents as any,
      });

      // Create Session logging the quick scan
      await tx.session.create({
        data: {
          name: `Mobile Quick Submit (Phiếu ${code})`,
          totalTags: tags.length,
          endedAt: now,
          orderId: newOrder.id,
          userId: user.id,
          scans: {
            create: tags.map(t => ({ tagEpc: t.epc, rssi: -50, scannedAt: now })),
          }
        }
      });

      return newOrder;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });

    const entity = new OrderEntity(order as any);
    this.eventEmitter.emit(ORDER_UPDATED_EVENT, entity);
    return entity;
  }
}
