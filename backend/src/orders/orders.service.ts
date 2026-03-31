import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { EventsGateway } from '../events/events.gateway';
import { randomBytes } from 'crypto';
import { BusinessException } from '@common/exceptions/business.exception';
import { PaginationHelper } from '@common/helpers/pagination.helper';
import { OrderStatus, Prisma } from '.prisma/client';
import { OrderEntity } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
  ) {}

  async create(createOrderDto: CreateOrderDto, user: { id: string; role: string; locationId?: string }) {
    const code = `${createOrderDto.type === 'INBOUND' ? 'IN' : 'OUT'}-${Date.now().toString().slice(-6)}-${randomBytes(2).toString('hex').toUpperCase()}`;

    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          code,
          type: createOrderDto.type,
          locationId: user.role === 'WAREHOUSE_MANAGER' ? user.locationId : createOrderDto.locationId,
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
          createdBy: { select: { id: true, username: true } },
        },
      });
      return newOrder;
    });

    const entity = new OrderEntity(order as any);
    this.events.server.emit('orderUpdate', entity);
    return entity;
  }

  async findAll(query: QueryOrdersDto, user: { role: string; locationId?: string }) {
    const { page = 1, limit = 20, search, type, status } = query;
    const where: Prisma.OrderWhereInput = { deletedAt: null };

    if (user.role === 'WAREHOUSE_MANAGER') {
      if (user.locationId) {
        where.locationId = user.locationId;
      } else {
        where.id = 'NO_LOCATION_ASSIGNED'; 
      }
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
          createdBy: { select: { id: true, username: true } },
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
      const scannedItems = order.items.reduce((sum, item) => sum + item.scannedQuantity, 0);
      return new OrderEntity({
        ...order,
        progress: targetItems > 0 ? Math.round((scannedItems / targetItems) * 100) : 0,
      } as any);
    });

    return PaginationHelper.paginate(formattedData, total, page, limit);
  }

  async findOne(id: string, user: { role: string; locationId?: string }) {
    const order = await this.prisma.order.findFirst({
      where: { id, deletedAt: null },
      include: {
        createdBy: { select: { id: true, username: true } },
        items: {
          include: { product: true },
        },
      },
    });
    
    if (!order) throw new BusinessException('Không tìm thấy đơn hàng', 'ORDER_NOT_FOUND', HttpStatus.NOT_FOUND);

    if (user.role === 'WAREHOUSE_MANAGER' && order.locationId !== user.locationId) {
      throw new BusinessException('Không có quyền truy cập đơn hàng này', 'ORDER_FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    const targetItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const scannedItems = order.items.reduce((sum, item) => sum + item.scannedQuantity, 0);
    
    return new OrderEntity({
      ...order,
      progress: targetItems > 0 ? Math.round((scannedItems / targetItems) * 100) : 0,
    } as any);
  }

  async update(id: string, updateOrderDto: any, user: { id: string; role: string; locationId?: string }) {
    const order = await this.prisma.order.findFirst({ where: { id, deletedAt: null } });
    if (!order) throw new BusinessException('Không tìm thấy đơn hàng', 'ORDER_NOT_FOUND', HttpStatus.NOT_FOUND);

    if (user.role === 'WAREHOUSE_MANAGER' && order.locationId !== user.locationId) {
      throw new BusinessException('Không có quyền truy cập đơn hàng này', 'ORDER_FORBIDDEN', HttpStatus.FORBIDDEN);
    }

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
          createdBy: { select: { id: true, username: true } },
        },
      });
      return newOrder;
    });

    const mapped = new OrderEntity(updated as any);
    this.events.server.emit('orderUpdate', mapped);
    return mapped;
  }

  async cancelOrder(id: string, user: { id: string; role: string; locationId?: string }) {
    const order = await this.prisma.order.findFirst({ where: { id, deletedAt: null } });
    if (!order) throw new BusinessException('Không tìm thấy đơn hàng', 'ORDER_NOT_FOUND', HttpStatus.NOT_FOUND);

    if (user.role === 'WAREHOUSE_MANAGER' && order.locationId !== user.locationId) {
      throw new BusinessException('Không có quyền truy cập đơn hàng này', 'ORDER_FORBIDDEN', HttpStatus.FORBIDDEN);
    }

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
    const order = await this.prisma.order.findFirst({ where: { id, deletedAt: null } });
    if (!order) throw new BusinessException('Không tìm thấy đơn hàng', 'ORDER_NOT_FOUND', HttpStatus.NOT_FOUND);

    if (user.role === 'WAREHOUSE_MANAGER' && order.locationId !== user.locationId) {
      throw new BusinessException('Không có quyền truy cập đơn hàng này', 'ORDER_FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: user.id },
    });

    const mapped = new OrderEntity(updated);
    this.events.server.emit('orderUpdate', mapped);
    return mapped;
  }
}
