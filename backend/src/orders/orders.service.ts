import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { EventsGateway } from '../events/events.gateway';
import { randomBytes } from 'crypto';
import { BusinessException } from '@common/exceptions/business.exception';
import { paginate } from '@common/helpers/pagination.helper';
import { OrderStatus, Prisma } from '.prisma/client';
import { plainToInstance } from 'class-transformer';
import { OrderEntity } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
  ) {}

  async create(createOrderDto: CreateOrderDto, userId: string) {
    const code = `${createOrderDto.type === 'INBOUND' ? 'IN' : 'OUT'}-${Date.now().toString().slice(-6)}-${randomBytes(2).toString('hex').toUpperCase()}`;

    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          code,
          type: createOrderDto.type,
          status: OrderStatus.PENDING,
          createdById: userId,
          updatedById: userId,
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

    this.events.server.emit('orderUpdate', plainToInstance(OrderEntity, order));
    return plainToInstance(OrderEntity, order);
  }

  async findAll(query: QueryOrdersDto) {
    const { page = 1, limit = 20, search, type, status } = query;
    const where: Prisma.OrderWhereInput = { deletedAt: null };

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
      return plainToInstance(OrderEntity, {
        ...order,
        progress: targetItems > 0 ? Math.round((scannedItems / targetItems) * 100) : 0,
      });
    });

    return paginate(formattedData, total, page, limit);
  }

  async findOne(id: string) {
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

    const targetItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const scannedItems = order.items.reduce((sum, item) => sum + item.scannedQuantity, 0);
    
    return plainToInstance(OrderEntity, {
      ...order,
      progress: targetItems > 0 ? Math.round((scannedItems / targetItems) * 100) : 0,
    });
  }

  async cancelOrder(id: string, userId: string) {
    const order = await this.prisma.order.findFirst({ where: { id, deletedAt: null } });
    if (!order) throw new BusinessException('Không tìm thấy đơn hàng', 'ORDER_NOT_FOUND', HttpStatus.NOT_FOUND);

    if (order.status !== OrderStatus.PENDING) {
      throw new BusinessException(`Không thể hủy đơn hàng đang ở trạng thái ${order.status}`, 'INVALID_STATUS_TRANSITION', HttpStatus.BAD_REQUEST);
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED, updatedById: userId },
    });

    const mapped = plainToInstance(OrderEntity, updated);
    this.events.server.emit('orderUpdate', mapped);
    return mapped;
  }

  async remove(id: string, userId: string) {
    const order = await this.prisma.order.findFirst({ where: { id, deletedAt: null } });
    if (!order) throw new BusinessException('Không tìm thấy đơn hàng', 'ORDER_NOT_FOUND', HttpStatus.NOT_FOUND);

    const updated = await this.prisma.order.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: userId },
    });

    const mapped = plainToInstance(OrderEntity, updated);
    this.events.server.emit('orderUpdate', mapped);
    return mapped;
  }
}
