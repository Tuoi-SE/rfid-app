import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { EventsGateway } from '../events/events.gateway';
import { randomBytes } from 'crypto';
import { BusinessException } from '@common/exceptions/business.exception';
import { PaginationHelper } from '@common/helpers/pagination.helper';
import { LocationType, OrderStatus, Prisma } from '.prisma/client';
import { OrderEntity } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
  ) {}

  private readonly outboundAllowedDestinationTypes: LocationType[] = [
    LocationType.WAREHOUSE,
    LocationType.WORKSHOP,
    LocationType.HOTEL,
    LocationType.RESORT,
    LocationType.SPA,
    LocationType.CUSTOMER,
  ];

  private readonly inboundAllowedDestinationTypes: LocationType[] = [
    LocationType.WORKSHOP,
    LocationType.WORKSHOP_WAREHOUSE,
    LocationType.WAREHOUSE,
  ];

  private async validateInboundDestination(
    locationId?: string,
    fallbackLocationId?: string,
  ) {
    const resolvedLocationId = locationId || fallbackLocationId;
    if (!resolvedLocationId) {
      throw new BusinessException(
        'Phiếu nhập kho bắt buộc chọn nơi nhập.',
        'INBOUND_DESTINATION_REQUIRED',
        HttpStatus.BAD_REQUEST,
      );
    }

    const destination = await this.prisma.location.findFirst({
      where: { id: resolvedLocationId, deletedAt: null },
      select: { id: true, type: true },
    });

    if (!destination) {
      throw new BusinessException(
        'Không tìm thấy vị trí nhận hàng cho phiếu nhập kho.',
        'LOCATION_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }

    if (!this.inboundAllowedDestinationTypes.includes(destination.type)) {
      throw new BusinessException(
        'Nơi nhập kho không hợp lệ. Chỉ hỗ trợ: kho xưởng hoặc kho tổng.',
        'INBOUND_DESTINATION_INVALID',
        HttpStatus.BAD_REQUEST,
      );
    }

    return destination.id;
  }

  private async validateOutboundDestination(locationId?: string) {
    if (!locationId) {
      throw new BusinessException(
        'Phiếu xuất kho bắt buộc chọn nơi xuất đến.',
        'OUTBOUND_DESTINATION_REQUIRED',
        HttpStatus.BAD_REQUEST,
      );
    }

    const destination = await this.prisma.location.findFirst({
      where: { id: locationId, deletedAt: null },
      select: { id: true, type: true },
    });

    if (!destination) {
      throw new BusinessException(
        'Không tìm thấy vị trí đích cho phiếu xuất kho.',
        'LOCATION_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }

    if (!this.outboundAllowedDestinationTypes.includes(destination.type)) {
      throw new BusinessException(
        'Nơi xuất đến không hợp lệ. Chỉ hỗ trợ: kho tổng, kho xưởng hoặc khách hàng.',
        'OUTBOUND_DESTINATION_INVALID',
        HttpStatus.BAD_REQUEST,
      );
    }

    return destination.id;
  }

  private async ensureManagerCanAccessOrder(
    order: { createdById?: string | null },
    user: { id: string; role: string; locationId?: string },
  ) {
    if (user.role !== 'WAREHOUSE_MANAGER') return;

    if (order.createdById !== user.id) {
      throw new BusinessException(
        'Không có quyền truy cập đơn hàng của manager khác',
        'ORDER_FORBIDDEN',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async create(createOrderDto: CreateOrderDto, user: { id: string; role: string; locationId?: string }) {
    const code = `${createOrderDto.type === 'INBOUND' ? 'IN' : 'OUT'}-${Date.now().toString().slice(-6)}-${randomBytes(2).toString('hex').toUpperCase()}`;

    // Resolve destination/location by order type.
    let mappedLocationId = createOrderDto.locationId;
    if (createOrderDto.type === 'INBOUND') {
      mappedLocationId = await this.validateInboundDestination(
        createOrderDto.locationId,
        user.role === 'WAREHOUSE_MANAGER' ? user.locationId : undefined,
      );
    } else if (createOrderDto.type === 'OUTBOUND') {
      mappedLocationId = await this.validateOutboundDestination(
        createOrderDto.locationId,
      );
    }

    if (user.role === 'WAREHOUSE_MANAGER') {
      const inboundAllowedIds = await this.getManagerInboundAllowedLocationIds(user.locationId);
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
    this.events.server.emit('orderUpdate', entity);
    return entity;
  }

  private async getAuthorizedLocationIds(locationId?: string): Promise<string[]> {
    if (!locationId) return [];
    const locs = await this.prisma.location.findMany({
      where: { OR: [{ id: locationId }, { parentId: locationId }], deletedAt: null },
      select: { id: true }
    });
    return locs.map(l => l.id);
  }

  private async getManagerInboundAllowedLocationIds(locationId?: string): Promise<string[]> {
    const [ownedAndChildren, centralWarehouses] = await Promise.all([
      this.getAuthorizedLocationIds(locationId),
      this.prisma.location.findMany({
        where: { type: LocationType.WAREHOUSE, deletedAt: null },
        select: { id: true },
      }),
    ]);

    return Array.from(new Set([...ownedAndChildren, ...centralWarehouses.map((loc) => loc.id)]));
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
      },
    });
    
    if (!order) throw new BusinessException('Không tìm thấy đơn hàng', 'ORDER_NOT_FOUND', HttpStatus.NOT_FOUND);

    await this.ensureManagerCanAccessOrder(order, user);

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

    await this.ensureManagerCanAccessOrder(order, user);

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
    this.events.server.emit('orderUpdate', mapped);
    return mapped;
  }

  async cancelOrder(id: string, user: { id: string; role: string; locationId?: string }) {
    if (user.role !== 'WAREHOUSE_MANAGER') {
      throw new BusinessException('Chỉ manager được huỷ phiếu kho.', 'ORDER_FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    const order = await this.prisma.order.findFirst({ where: { id, deletedAt: null } });
    if (!order) throw new BusinessException('Không tìm thấy đơn hàng', 'ORDER_NOT_FOUND', HttpStatus.NOT_FOUND);

    await this.ensureManagerCanAccessOrder(order, user);

    if (order.status !== OrderStatus.PENDING) {
      throw new BusinessException(`Không thể hủy đơn hàng đang ở trạng thái ${order.status}`, 'INVALID_STATUS_TRANSITION', HttpStatus.BAD_REQUEST);
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED, updatedById: user.id },
    });

    const mapped = new OrderEntity(updated);
    this.events.server.emit('orderUpdate', mapped);
    return mapped;
  }

  async remove(id: string, user: { id: string; role: string; locationId?: string }) {
    if (user.role !== 'WAREHOUSE_MANAGER') {
      throw new BusinessException('Chỉ manager được xoá phiếu kho.', 'ORDER_FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    const order = await this.prisma.order.findFirst({ where: { id, deletedAt: null } });
    if (!order) throw new BusinessException('Không tìm thấy đơn hàng', 'ORDER_NOT_FOUND', HttpStatus.NOT_FOUND);

    await this.ensureManagerCanAccessOrder(order, user);

    const updated = await this.prisma.order.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: user.id },
    });

    const mapped = new OrderEntity(updated);
    this.events.server.emit('orderUpdate', mapped);
    return mapped;
  }
}
