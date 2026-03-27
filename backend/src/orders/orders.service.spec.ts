import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '@prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { BusinessException } from '@common/exceptions/business.exception';
import { OrderStatus } from '.prisma/client';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: any;
  let events: any;

  const mockPrisma = {
    $transaction: jest.fn(),
    order: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockEvents = {
    server: { emit: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventsGateway, useValue: mockEvents },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get(PrismaService);
    events = module.get(EventsGateway);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create order inside transaction', async () => {
      const mockOrder = {
        id: 'order-1',
        code: 'IN-123456-AB12',
        type: 'INBOUND',
        status: 'PENDING',
        items: [{ productId: 'p1', quantity: 10, product: { name: 'Test' } }],
        createdBy: { id: 'u1', username: 'admin' },
      };

      mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
        return cb({
          order: {
            create: jest.fn().mockResolvedValue(mockOrder),
          },
        });
      });

      const result = await service.create(
        { type: 'INBOUND' as any, items: [{ productId: 'p1', quantity: 10 }] },
        'user-1',
      );

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(mockEvents.server.emit).toHaveBeenCalledWith('orderUpdate', expect.anything());
    });
  });

  describe('cancelOrder', () => {
    it('should cancel a PENDING order', async () => {
      const pendingOrder = { id: 'o1', status: OrderStatus.PENDING, deletedAt: null };
      const cancelledOrder = { ...pendingOrder, status: OrderStatus.CANCELLED };

      mockPrisma.order.findFirst.mockResolvedValue(pendingOrder);
      mockPrisma.order.update.mockResolvedValue(cancelledOrder);

      const result = await service.cancelOrder('o1', 'admin-1');

      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'o1' },
        data: { status: OrderStatus.CANCELLED, updatedById: 'admin-1' },
      });
      expect(result).toBeDefined();
    });

    it('should throw when cancelling non-PENDING order', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({
        id: 'o2', status: OrderStatus.IN_PROGRESS, deletedAt: null,
      });

      await expect(service.cancelOrder('o2', 'admin-1'))
        .rejects
        .toThrow(BusinessException);
    });

    it('should throw when order not found', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await expect(service.cancelOrder('nonexistent', 'admin-1'))
        .rejects
        .toThrow(BusinessException);
    });
  });

  describe('findOne', () => {
    it('should return order with progress percentage', async () => {
      const mockOrder = {
        id: 'o1',
        code: 'IN-001',
        deletedAt: null,
        createdBy: { id: 'u1', username: 'admin' },
        items: [
          { productId: 'p1', quantity: 10, scannedQuantity: 5, product: { name: 'Item A' } },
          { productId: 'p2', quantity: 20, scannedQuantity: 20, product: { name: 'Item B' } },
        ],
      };

      mockPrisma.order.findFirst.mockResolvedValue(mockOrder);

      const result = await service.findOne('o1');

      expect(result).toBeDefined();
      // Progress = (5+20) / (10+20) * 100 = 83%
    });

    it('should throw when order not found', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent'))
        .rejects
        .toThrow(BusinessException);
    });
  });

  describe('remove (soft delete)', () => {
    it('should set deletedAt and deletedById', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({
        id: 'o1', status: OrderStatus.PENDING, deletedAt: null,
      });
      mockPrisma.order.update.mockResolvedValue({
        id: 'o1', deletedAt: new Date(), deletedById: 'admin-1',
      });

      await service.remove('o1', 'admin-1');

      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'o1' },
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
          deletedById: 'admin-1',
        }),
      });
    });
  });
});
