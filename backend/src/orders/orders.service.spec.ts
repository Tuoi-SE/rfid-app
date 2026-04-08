import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrdersService } from './orders.service';
import { PrismaService } from '@prisma/prisma.service';
import { BusinessException } from '@common/exceptions/business.exception';
import { OrderStatus } from '.prisma/client';
import { OrderValidationService } from './order-validation.service';
import { OrderLocationService } from './order-location.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: any;
  let eventEmitter: any;

  const mockPrisma = {
    $transaction: jest.fn(),
    location: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    order: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockOrderValidation = {
    validateInboundDestination: jest.fn(),
    validateOutboundDestination: jest.fn(),
    ensureManagerCanAccessOrder: jest.fn(),
  };

  const mockOrderLocation = {
    getAuthorizedLocationIds: jest.fn(),
    getManagerInboundAllowedLocationIds: jest.fn(),
    determineTagStatusAndLocation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: OrderValidationService, useValue: mockOrderValidation },
        { provide: OrderLocationService, useValue: mockOrderLocation },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get(PrismaService);
    eventEmitter = module.get(EventEmitter2);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create order inside transaction', async () => {
      mockPrisma.location.findFirst.mockResolvedValue({ id: 'loc-1', type: 'WAREHOUSE' });
      mockOrderValidation.validateInboundDestination.mockResolvedValue('loc-1');

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
        { type: 'INBOUND' as any, locationId: 'loc-1', items: [{ productId: 'p1', quantity: 10 }] },
        { id: 'user-1', role: 'ADMIN', locationId: 'loc-1' },
      );

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('order:updated', expect.anything());
    });
  });

  describe('cancelOrder', () => {
    it('should cancel a PENDING order', async () => {
      const pendingOrder = { id: 'o1', status: OrderStatus.PENDING, deletedAt: null, createdById: 'admin-1' };
      const cancelledOrder = { ...pendingOrder, status: OrderStatus.CANCELLED };

      mockPrisma.order.findFirst.mockResolvedValue(pendingOrder);
      mockPrisma.order.update.mockResolvedValue(cancelledOrder);

      const result = await service.cancelOrder('o1', { id: 'admin-1', role: 'WAREHOUSE_MANAGER', locationId: 'loc-1' });

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

      await expect(service.cancelOrder('o2', { id: 'admin-1', role: 'WAREHOUSE_MANAGER', locationId: 'loc-1' }))
        .rejects
        .toThrow(BusinessException);
    });

    it('should throw when order not found', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await expect(service.cancelOrder('nonexistent', { id: 'admin-1', role: 'WAREHOUSE_MANAGER', locationId: 'loc-1' }))
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

      const result = await service.findOne('o1', { id: 'u1', role: 'ADMIN' });

      expect(result).toBeDefined();
      // Progress = (5+20) / (10+20) * 100 = 83%
    });

    it('should throw when order not found', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', { id: 'u1', role: 'ADMIN' }))
        .rejects
        .toThrow(BusinessException);
    });
  });

  describe('remove (soft delete)', () => {
    it('should set deletedAt and deletedById', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({
        id: 'o1', status: OrderStatus.PENDING, deletedAt: null, createdById: 'admin-1',
      });
      mockPrisma.order.update.mockResolvedValue({
        id: 'o1', deletedAt: new Date(), deletedById: 'admin-1',
      });

      await service.remove('o1', { id: 'admin-1', role: 'WAREHOUSE_MANAGER', locationId: 'loc-1' });

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
