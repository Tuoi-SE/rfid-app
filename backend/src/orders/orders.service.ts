import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { EventsGateway } from '../events/events.gateway';
import { randomBytes } from 'crypto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
  ) {}

  async create(createOrderDto: CreateOrderDto, userId: string) {
    const code = `${createOrderDto.type === 'INBOUND' ? 'IN' : 'OUT'}-${Date.now().toString().slice(-6)}-${randomBytes(2).toString('hex').toUpperCase()}`;

    const order = await this.prisma.order.create({
      data: {
        code,
        type: createOrderDto.type,
        status: 'PENDING',
        userId,
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
        user: { select: { username: true } },
      },
    });

    this.events.server.emit('orderUpdate', order);
    return order;
  }

  async findAll() {
    return this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { username: true } },
        items: {
          include: { product: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { username: true } },
        items: {
          include: { product: true },
        },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }
}
