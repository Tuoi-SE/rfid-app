import { Test, TestingModule } from '@nestjs/testing';
import { TransfersService } from './transfers.service';
import { PrismaService } from '@prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TransferValidationService } from './transfer-validation.service';
import { TransferLocationService } from './transfer-location.service';
import { BusinessException } from '@common/exceptions/business.exception';
import { TRANSFER_ERROR_CODES } from '@common/constants/error-codes';
import { LocationType, TransferStatus, TagStatus } from '@prisma/client';

describe('TransfersService', () => {
  let service: TransfersService;
  let prisma: any;
  let eventEmitter: any;

  const mockAdminLocation = { id: 'loc-admin', type: LocationType.ADMIN, code: 'ADMIN-01', name: 'Admin Location' };
  const mockWorkshopLocation = { id: 'loc-ws', type: LocationType.WORKSHOP, code: 'WS-01', name: 'Workshop' };
  const mockWarehouseLocation = { id: 'loc-wh', type: LocationType.WAREHOUSE, code: 'WH-01', name: 'Warehouse' };
  const mockHotelLocation = { id: 'loc-hotel', type: LocationType.HOTEL, code: 'HOTEL-01', name: 'Hotel' };

  const adminUser = { id: 'user-admin', role: 'ADMIN', locationId: 'loc-admin' };
  const superAdminUser = { id: 'user-super', role: 'SUPER_ADMIN', locationId: 'loc-admin' };
  const staffUser = { id: 'user-staff', role: 'STAFF', locationId: 'loc-admin' };
  const wmUser = { id: 'user-wm', role: 'WAREHOUSE_MANAGER', locationId: 'loc-wh' };

  const baseTransfer = {
    id: 'transfer-1', code: 'TRF-123456-AB', type: 'ADMIN_TO_WORKSHOP', status: TransferStatus.PENDING,
    sourceId: 'loc-admin', destinationId: 'loc-ws', createdById: 'user-admin', completedAt: null,
    createdAt: new Date(), updatedAt: new Date(),
    source: mockAdminLocation, destination: mockWorkshopLocation,
    createdBy: { id: 'user-admin', username: 'admin', role: 'ADMIN' }, items: [],
  };

  const mockPrismaService = {
    location: { findUnique: jest.fn() },
    transfer: { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn(), count: jest.fn() },
    tag: { findMany: jest.fn(), updateMany: jest.fn() },
    transferItem: { findMany: jest.fn(), createMany: jest.fn(), updateMany: jest.fn() },
  };

  const mockEventEmitter = { emit: jest.fn() };
  const mockTransferValidationService = { validateTagsForCreateTransfer: jest.fn() };
  const mockTransferLocationService = { getAuthorizedLocationIds: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransfersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: TransferValidationService, useValue: mockTransferValidationService },
        { provide: TransferLocationService, useValue: mockTransferLocationService },
      ],
    }).compile();
    service = module.get<TransfersService>(TransfersService);
    prisma = module.get(PrismaService);
    eventEmitter = module.get(EventEmitter2);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw BusinessException with SOURCE_NOT_FOUND when source location does not exist', async () => {
      mockPrismaService.location.findUnique.mockResolvedValue(null);
      await expect(service.create({ sourceId: 'invalid', destinationId: 'loc-ws', tagIds: ['tag-1'], type: 'ADMIN_TO_WORKSHOP' }, adminUser))
        .rejects.toMatchObject({ response: { error: { code: TRANSFER_ERROR_CODES.SOURCE_NOT_FOUND } } });
    });

    it('should throw BusinessException with DEST_NOT_FOUND when destination location does not exist', async () => {
      mockPrismaService.location.findUnique.mockResolvedValueOnce(mockAdminLocation).mockResolvedValueOnce(null);
      await expect(service.create({ sourceId: 'loc-admin', destinationId: 'invalid', tagIds: ['tag-1'], type: 'ADMIN_TO_WORKSHOP' }, adminUser))
        .rejects.toMatchObject({ response: { error: { code: TRANSFER_ERROR_CODES.DEST_NOT_FOUND } } });
    });

    it('should throw BusinessException with INVALID_REQUEST when source type is wrong for ADMIN_TO_WORKSHOP', async () => {
      mockPrismaService.location.findUnique.mockResolvedValueOnce(mockWorkshopLocation).mockResolvedValueOnce(mockWorkshopLocation);
      await expect(service.create({ sourceId: 'loc-ws', destinationId: 'loc-ws', tagIds: ['tag-1'], type: 'ADMIN_TO_WORKSHOP' }, adminUser))
        .rejects.toMatchObject({ response: { error: { code: TRANSFER_ERROR_CODES.INVALID_REQUEST } } });
    });

    it('should create a transfer successfully for ADMIN_TO_WORKSHOP', async () => {
      mockPrismaService.location.findUnique.mockResolvedValueOnce(mockAdminLocation).mockResolvedValueOnce(mockWorkshopLocation);
      mockTransferValidationService.validateTagsForCreateTransfer.mockResolvedValue({ acceptedTagIds: ['tag-1'], tagsToRecall: [] });
      mockPrismaService.transfer.create.mockResolvedValue(baseTransfer);
      const result = await service.create({ sourceId: 'loc-admin', destinationId: 'loc-ws', tagIds: ['tag-1'], type: 'ADMIN_TO_WORKSHOP' }, adminUser);
      expect(result).toEqual(baseTransfer);
      expect(mockPrismaService.transfer.create).toHaveBeenCalled();
      expect(mockPrismaService.tag.updateMany).toHaveBeenCalledWith({ where: { id: { in: ['tag-1'] } }, data: { status: TagStatus.IN_TRANSIT, locationId: null } });
      expect(mockEventEmitter.emit).toHaveBeenCalled();
    });

    it('should create WAREHOUSE_TO_CUSTOMER transfer as COMPLETED immediately', async () => {
      const completedTransfer = { ...baseTransfer, type: 'WAREHOUSE_TO_CUSTOMER', status: TransferStatus.COMPLETED, completedAt: new Date() };
      mockPrismaService.location.findUnique.mockResolvedValueOnce(mockWarehouseLocation).mockResolvedValueOnce(mockHotelLocation);
      mockTransferValidationService.validateTagsForCreateTransfer.mockResolvedValue({ acceptedTagIds: ['tag-1'], tagsToRecall: [] });
      mockPrismaService.transfer.create.mockResolvedValue(completedTransfer);
      const result = await service.create({ sourceId: 'loc-wh', destinationId: 'loc-hotel', tagIds: ['tag-1'], type: 'WAREHOUSE_TO_CUSTOMER' }, adminUser);
      expect(result.status).toBe(TransferStatus.COMPLETED);
      expect(mockPrismaService.tag.updateMany).toHaveBeenCalledWith({ where: { id: { in: ['tag-1'] } }, data: { locationId: 'loc-hotel', status: TagStatus.COMPLETED } });
    });

    it('should throw BusinessException with INVALID_TYPE for invalid transfer type', async () => {
      mockPrismaService.location.findUnique.mockResolvedValueOnce(mockAdminLocation).mockResolvedValueOnce(mockWorkshopLocation);
      await expect(service.create({ sourceId: 'loc-admin', destinationId: 'loc-ws', tagIds: ['tag-1'], type: 'INVALID_TYPE' }, adminUser))
        .rejects.toMatchObject({ response: { error: { code: TRANSFER_ERROR_CODES.INVALID_TYPE } } });
    });
  });

  describe('findOne', () => {
    it('should throw BusinessException with NOT_FOUND when transfer does not exist', async () => {
      mockPrismaService.transfer.findUnique.mockResolvedValue(null);
      await expect(service.findOne('invalid', adminUser))
        .rejects.toMatchObject({ response: { error: { code: TRANSFER_ERROR_CODES.NOT_FOUND } } });
    });

    it('should return transfer for ADMIN role', async () => {
      mockPrismaService.transfer.findUnique.mockResolvedValue(baseTransfer);
      const result = await service.findOne('transfer-1', adminUser);
      expect(result).toEqual(baseTransfer);
    });

    it('should throw BusinessException with ACCESS_DENIED for WAREHOUSE_MANAGER accessing unauthorized transfer', async () => {
      mockPrismaService.transfer.findUnique.mockResolvedValue(baseTransfer);
      mockTransferLocationService.getAuthorizedLocationIds.mockResolvedValue(['other-loc']);
      await expect(service.findOne('transfer-1', wmUser))
        .rejects.toMatchObject({ response: { error: { code: TRANSFER_ERROR_CODES.ACCESS_DENIED } } });
    });

    it('should allow WAREHOUSE_MANAGER to access transfer within authorized locations', async () => {
      const whTransfer = { ...baseTransfer, sourceId: 'loc-wh', destinationId: 'loc-hotel' };
      mockPrismaService.transfer.findUnique.mockResolvedValue(whTransfer);
      mockTransferLocationService.getAuthorizedLocationIds.mockResolvedValue(['loc-wh', 'loc-hotel']);
      const result = await service.findOne('transfer-1', wmUser);
      expect(result).toEqual(whTransfer);
    });
  });

  describe('findAll', () => {
    it('should return paginated transfers for ADMIN', async () => {
      mockPrismaService.transfer.findMany.mockResolvedValue([baseTransfer]);
      mockPrismaService.transfer.count.mockResolvedValue(1);
      const result = await service.findAll({ page: 1, limit: 20 }, adminUser);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
    });

    it('should apply WAREHOUSE_MANAGER location filter', async () => {
      mockPrismaService.transfer.findMany.mockResolvedValue([]);
      mockPrismaService.transfer.count.mockResolvedValue(0);
      mockTransferLocationService.getAuthorizedLocationIds.mockResolvedValue(['loc-wh']);
      await service.findAll({ page: 1, limit: 20 }, wmUser);
      expect(mockPrismaService.transfer.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ OR: [{ sourceId: { in: ['loc-wh'] } }, { destinationId: { in: ['loc-wh'] } }] }),
      }));
    });

    it('should filter by status and type', async () => {
      mockPrismaService.transfer.findMany.mockResolvedValue([]);
      mockPrismaService.transfer.count.mockResolvedValue(0);
      await service.findAll({ page: 1, limit: 20, status: TransferStatus.COMPLETED, type: 'ADMIN_TO_WORKSHOP' }, adminUser);
      expect(mockPrismaService.transfer.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ status: TransferStatus.COMPLETED, type: 'ADMIN_TO_WORKSHOP' }),
      }));
    });
  });

  describe('cancel', () => {
    it('should throw BusinessException with ACCESS_DENIED when non-admin tries to cancel', async () => {
      await expect(service.cancel('transfer-1', staffUser))
        .rejects.toMatchObject({ response: { error: { code: TRANSFER_ERROR_CODES.ACCESS_DENIED } } });
    });

    it('should throw BusinessException with NOT_FOUND when transfer does not exist', async () => {
      mockPrismaService.transfer.findUnique.mockResolvedValue(null);
      await expect(service.cancel('invalid', adminUser))
        .rejects.toMatchObject({ response: { error: { code: TRANSFER_ERROR_CODES.NOT_FOUND } } });
    });

    it('should throw BusinessException with INVALID_STATUS when transfer is not PENDING or COMPLETED', async () => {
      mockPrismaService.transfer.findUnique.mockResolvedValue({ ...baseTransfer, status: TransferStatus.CANCELLED });
      await expect(service.cancel('transfer-1', adminUser))
        .rejects.toMatchObject({ response: { error: { code: TRANSFER_ERROR_CODES.INVALID_STATUS } } });
    });

    it('should cancel transfer and revert tag statuses for PENDING transfer from workshop', async () => {
      const transferWithItems = { ...baseTransfer, status: TransferStatus.PENDING, items: [{ tagId: 'tag-1' }], source: mockWorkshopLocation };
      mockPrismaService.transfer.findUnique.mockResolvedValue(transferWithItems);
      mockPrismaService.transfer.update.mockResolvedValue({ ...transferWithItems, status: TransferStatus.CANCELLED });
      const result = await service.cancel('transfer-1', adminUser);
      expect(result.status).toBe(TransferStatus.CANCELLED);
      expect(mockPrismaService.tag.updateMany).toHaveBeenCalledWith({ where: { id: { in: ['tag-1'] } }, data: { status: TagStatus.IN_WORKSHOP, locationId: 'loc-admin' } });
      expect(mockEventEmitter.emit).toHaveBeenCalled();
    });

    it('should cancel transfer and revert tag statuses for COMPLETED transfer from warehouse', async () => {
      const completedTransfer = { ...baseTransfer, status: TransferStatus.COMPLETED, items: [{ tagId: 'tag-1' }], source: mockWarehouseLocation };
      mockPrismaService.transfer.findUnique.mockResolvedValue(completedTransfer);
      mockPrismaService.transfer.update.mockResolvedValue({ ...completedTransfer, status: TransferStatus.CANCELLED });
      const result = await service.cancel('transfer-1', adminUser);
      expect(result.status).toBe(TransferStatus.CANCELLED);
      expect(mockPrismaService.tag.updateMany).toHaveBeenCalledWith({ where: { id: { in: ['tag-1'] } }, data: { status: TagStatus.IN_WAREHOUSE, locationId: 'loc-admin' } });
    });
  });

  describe('updateDestination', () => {
    it('should throw BusinessException with ACCESS_DENIED when non-SUPER_ADMIN tries to update destination', async () => {
      await expect(service.updateDestination('transfer-1', 'loc-ws', adminUser))
        .rejects.toMatchObject({ response: { error: { code: TRANSFER_ERROR_CODES.ACCESS_DENIED } } });
    });

    it('should throw BusinessException with NOT_FOUND when transfer does not exist', async () => {
      mockPrismaService.transfer.findUnique.mockResolvedValue(null);
      await expect(service.updateDestination('invalid', 'loc-ws', superAdminUser))
        .rejects.toMatchObject({ response: { error: { code: TRANSFER_ERROR_CODES.NOT_FOUND } } });
    });

    it('should throw BusinessException with INVALID_STATUS when transfer is not PENDING', async () => {
      mockPrismaService.transfer.findUnique.mockResolvedValue({ ...baseTransfer, status: TransferStatus.COMPLETED });
      await expect(service.updateDestination('transfer-1', 'loc-ws', superAdminUser))
        .rejects.toMatchObject({ response: { error: { code: TRANSFER_ERROR_CODES.INVALID_STATUS } } });
    });

    it('should throw BusinessException with DEST_NOT_FOUND when new destination location does not exist', async () => {
      mockPrismaService.transfer.findUnique.mockResolvedValue({ ...baseTransfer, status: TransferStatus.PENDING });
      mockPrismaService.location.findUnique.mockResolvedValue(null);
      await expect(service.updateDestination('transfer-1', 'invalid', superAdminUser))
        .rejects.toMatchObject({ response: { error: { code: TRANSFER_ERROR_CODES.DEST_NOT_FOUND } } });
    });

    it('should update destination successfully for SUPER_ADMIN', async () => {
      const pendingTransfer = { ...baseTransfer, status: TransferStatus.PENDING };
      const updatedTransfer = { ...pendingTransfer, destinationId: 'loc-ws', destination: mockWorkshopLocation };
      mockPrismaService.transfer.findUnique.mockResolvedValue(pendingTransfer);
      mockPrismaService.location.findUnique.mockResolvedValue(mockWorkshopLocation);
      mockPrismaService.transfer.update.mockResolvedValue(updatedTransfer);
      const result = await service.updateDestination('transfer-1', 'loc-ws', superAdminUser);
      expect(result.destinationId).toBe('loc-ws');
      expect(mockEventEmitter.emit).toHaveBeenCalled();
    });
  });

  describe('confirm', () => {
    it('should throw BusinessException with NOT_FOUND when transfer does not exist', async () => {
      mockPrismaService.transfer.findUnique.mockResolvedValue(null);
      await expect(service.confirm('invalid', {}, adminUser))
        .rejects.toMatchObject({ response: { error: { code: TRANSFER_ERROR_CODES.NOT_FOUND } } });
    });

    it('should throw BusinessException with INVALID_STATUS when transfer is not PENDING', async () => {
      mockPrismaService.transfer.findUnique.mockResolvedValue({ ...baseTransfer, status: TransferStatus.COMPLETED });
      await expect(service.confirm('transfer-1', {}, adminUser))
        .rejects.toMatchObject({ response: { error: { code: TRANSFER_ERROR_CODES.INVALID_STATUS } } });
    });

    it('should complete transfer with all items scanned (manual confirm bypass)', async () => {
      const pendingTransfer = { ...baseTransfer, status: TransferStatus.PENDING, type: 'ADMIN_TO_WORKSHOP', items: [{ tagId: 'tag-1', tag: { id: 'tag-1', epc: 'epc-1' } }], destination: mockWorkshopLocation };
      const completedTransfer = { ...pendingTransfer, status: TransferStatus.COMPLETED };
      mockPrismaService.transfer.findUnique.mockResolvedValue(pendingTransfer);
      mockPrismaService.transfer.update.mockResolvedValue(completedTransfer);
      const result = await service.confirm('transfer-1', {}, adminUser);
      expect(result.status).toBe(TransferStatus.COMPLETED);
      expect(mockPrismaService.tag.updateMany).toHaveBeenCalled();
      expect(mockPrismaService.transferItem.updateMany).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalled();
    });

    it('should mark missing tags separately when partial scans provided', async () => {
      const pendingTransfer = { ...baseTransfer, status: TransferStatus.PENDING, type: 'ADMIN_TO_WORKSHOP', items: [{ tagId: 'tag-1', tag: { id: 'tag-1', epc: 'epc-1' } }, { tagId: 'tag-2', tag: { id: 'tag-2', epc: 'epc-2' } }], destination: mockWorkshopLocation };
      const completedTransfer = { ...pendingTransfer, status: TransferStatus.COMPLETED };
      mockPrismaService.transfer.findUnique.mockResolvedValue(pendingTransfer);
      mockPrismaService.transfer.update.mockResolvedValue(completedTransfer);
      await service.confirm('transfer-1', { scans: [{ epc: 'epc-1' }] }, adminUser);
      // Two tag.updateMany calls: scanned + missing; plus one transferItem.updateMany
      expect(mockPrismaService.tag.updateMany).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.transferItem.updateMany).toHaveBeenCalled();
    });
  });
});
