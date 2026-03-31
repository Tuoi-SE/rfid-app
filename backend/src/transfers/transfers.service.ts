import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { ConfirmTransferDto } from './dto/confirm-transfer.dto';
import { QueryTransfersDto } from './dto/query-transfers.dto';
import { EventsGateway } from '../events/events.gateway';
import { randomBytes } from 'crypto';
import { LocationType, TransferStatus, TagStatus, Role, Prisma } from '@prisma/client';

@Injectable()
export class TransfersService {
  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
  ) {}

  async create(dto: CreateTransferDto, user: { id: string; role: string; locationId?: string }) {
    // Validate source location based on transfer type (per D-12)
    const source = await this.prisma.location.findUnique({ where: { id: dto.sourceId } });
    if (!source) throw new NotFoundException('Không tìm thấy vị trí nguồn');

    // Validate destination location based on transfer type (per D-13)
    const destination = await this.prisma.location.findUnique({ where: { id: dto.destinationId } });
    if (!destination) throw new NotFoundException('Không tìm thấy vị trí đích');

    // Type-specific validation
    if (dto.type === 'ADMIN_TO_WORKSHOP') {
      if (source.type !== LocationType.ADMIN) {
        throw new BadRequestException('Vị trí nguồn phải là ADMIN');
      }
      if (destination.type !== LocationType.WORKSHOP) {
        throw new BadRequestException('Vị trí đích phải là WORKSHOP');
      }
    } else if (dto.type === 'WORKSHOP_TO_WAREHOUSE') {
      if (source.type !== LocationType.WORKSHOP) {
        throw new BadRequestException('Vị trí nguồn phải là WORKSHOP');
      }
      if (destination.type !== LocationType.WAREHOUSE) {
        throw new BadRequestException('Vị trí đích phải là WAREHOUSE');
      }
    } else if (dto.type === 'WAREHOUSE_TO_CUSTOMER') {
      // D-18: WAREHOUSE_TO_CUSTOMER: source=WAREHOUSE, destination=HOTEL/RESORT/SPA
      if (source.type !== LocationType.WAREHOUSE) {
        throw new BadRequestException('Vị trí nguồn phải là WAREHOUSE');
      }
      if (
        destination.type !== LocationType.HOTEL &&
        destination.type !== LocationType.RESORT &&
        destination.type !== LocationType.SPA &&
        destination.type !== 'CUSTOMER' // backward compat
      ) {
        throw new BadRequestException('Vị trí đích phải là HOTEL, RESORT, hoặc SPA');
      }
    } else {
      throw new BadRequestException('Loại transfer không hợp lệ');
    }

    // D-22: WAREHOUSE_TO_CUSTOMER - validate stock limit
    // All tags must be at source warehouse before export
    if (dto.type === 'WAREHOUSE_TO_CUSTOMER') {
      const tagsAtSource = await this.prisma.tag.findMany({
        where: { id: { in: dto.tagIds } },
      });
      const notAtSource = tagsAtSource.filter(t => t.locationId !== dto.sourceId);
      if (notAtSource.length > 0) {
        throw new BadRequestException(
          `${notAtSource.length} tag(s) không có tại warehouse nguồn. Chỉ xuất được tag đang ở warehouse.`
        );
      }
    }

    // Generate unique code: TRF-{timestamp}-{random}
    const code = `TRF-${Date.now().toString().slice(-6)}-${randomBytes(2).toString('hex').toUpperCase()}`;

    // Validate tags exist and are available
    const tags = await this.prisma.tag.findMany({
      where: { id: { in: dto.tagIds } },
    });
    if (tags.length !== dto.tagIds.length) {
      throw new BadRequestException('Một số tag không tồn tại');
    }

    // Check no pending transfer for these tags
    const pendingTransfers = await this.prisma.transferItem.findMany({
      where: {
        tagId: { in: dto.tagIds },
        transfer: { status: TransferStatus.PENDING },
      },
    });
    if (pendingTransfers.length > 0) {
      throw new BadRequestException('Một số tag đang trong transfer PENDING khác');
    }

    // D-20: WAREHOUSE_TO_CUSTOMER - 1-step workflow (tạo = COMPLETED ngay)
    const isWarehouseToCustomer = dto.type === 'WAREHOUSE_TO_CUSTOMER';

    // Create transfer - WAREHOUSE_TO_CUSTOMER created as COMPLETED immediately
    const transfer = await this.prisma.transfer.create({
      data: {
        code,
        type: dto.type,
        status: isWarehouseToCustomer ? TransferStatus.COMPLETED : TransferStatus.PENDING,
        sourceId: dto.sourceId,
        destinationId: dto.destinationId,
        createdById: user.id,
        completedAt: isWarehouseToCustomer ? new Date() : null,  // D-20: set completedAt immediately
        items: {
          create: dto.tagIds.map(tagId => ({
            tagId,
            scannedAt: isWarehouseToCustomer ? new Date() : null,  // D-20: Mark as scanned
            condition: isWarehouseToCustomer ? 'GOOD' : undefined,
          })),
        },
      },
      include: {
        source: true,
        destination: true,
        createdBy: { select: { username: true } },
        items: { include: { tag: true } },
      },
    });

    // D-20: WAREHOUSE_TO_CUSTOMER - update tags immediately to COMPLETED
    if (isWarehouseToCustomer) {
      // D-19: Tags at customer get OUT_OF_STOCK status
      await this.prisma.tag.updateMany({
        where: { id: { in: dto.tagIds } },
        data: {
          locationId: dto.destinationId,
          status: TagStatus.COMPLETED,
        },
      });
      this.events.server.emit('transferUpdate', transfer);
      return transfer;
    }

    // UPDATE: Set tag status to IN_TRANSIT and locationId to null
    await this.prisma.tag.updateMany({
      where: { id: { in: dto.tagIds } },
      data: {
        status: TagStatus.IN_TRANSIT,
        locationId: null, 
      },
    });

    this.events.server.emit('transferUpdate', transfer);
    return transfer;
  }

  async confirm(transferId: string, dto: ConfirmTransferDto, user: { id: string; role: string; locationId?: string }) {
    const transfer = await this.prisma.transfer.findUnique({
      where: { id: transferId },
      include: { items: { include: { tag: true } }, destination: true },
    });

    if (!transfer) throw new NotFoundException('Không tìm thấy transfer');
    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException('Transfer không ở trạng thái PENDING');
    }

    // Identify scanned tags vs missing tags
    let scannedTagIds: string[] = [];
    let missingTagIds: string[] = [];
    const isWarehouseToCustomer = transfer.type === 'WAREHOUSE_TO_CUSTOMER';

    if (dto.scans && dto.scans.length > 0) {
      const scannedEpcs = dto.scans.map(s => s.epc);
      const scannedItems = transfer.items.filter(item => scannedEpcs.includes(item.tag.epc));
      const missingItems = transfer.items.filter(item => !scannedEpcs.includes(item.tag.epc));
      
      scannedTagIds = scannedItems.map(i => i.tagId);
      missingTagIds = missingItems.map(i => i.tagId);
    } else {
      // Auto-receive everything if no specific scans provided (manual confirm bypass)
      scannedTagIds = transfer.items.map(i => i.tagId);
      missingTagIds = [];
    }

    // Determine target location status
    const targetStatus = isWarehouseToCustomer ? TagStatus.COMPLETED : 
                         transfer.destination.type === 'WORKSHOP' ? TagStatus.IN_WORKSHOP : 
                         transfer.destination.type === 'WAREHOUSE' ? TagStatus.IN_WAREHOUSE : 
                         TagStatus.IN_TRANSIT;

    if (scannedTagIds.length > 0) {
      // Update scanned tags: locationId = destination, status = appropriate target
      await this.prisma.tag.updateMany({
        where: { id: { in: scannedTagIds } },
        data: {
          locationId: transfer.destinationId,
          status: targetStatus,
        },
      });

      // Mark items as scanned
      await this.prisma.transferItem.updateMany({
        where: { transferId, tagId: { in: scannedTagIds } },
        data: {
          scannedAt: new Date(),
          condition: 'GOOD',
        },
      });
    }

    if (missingTagIds.length > 0) {
      // Tags missing from the transfer scan
      await this.prisma.tag.updateMany({
        where: { id: { in: missingTagIds } },
        data: {
          status: TagStatus.MISSING,
        },
      });
    }

    // Complete transfer
    const completedTransfer = await this.prisma.transfer.update({
      where: { id: transferId },
      data: {
        status: TransferStatus.COMPLETED,
        completedAt: new Date(),
      },
      include: {
        source: true,
        destination: true,
        createdBy: { select: { username: true } },
        items: { include: { tag: true } },
      },
    });

    this.events.server.emit('transferUpdate', completedTransfer);
    return completedTransfer;
  }

  async findAll(query: QueryTransfersDto, user: { id: string; role: string; locationId?: string }) {
    const { page = 1, limit = 20, status, type, sourceId, destinationId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TransferWhereInput = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (sourceId) where.sourceId = sourceId;
    if (destinationId) where.destinationId = destinationId;

    if (user.role === 'WAREHOUSE_MANAGER') {
      if (user.locationId) {
        where.OR = [
          { sourceId: user.locationId },
          { destinationId: user.locationId }
        ];
      } else {
        where.id = 'NO_LOCATION_ASSIGNED';
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.transfer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          source: true,
          destination: true,
          createdBy: { select: { username: true } },
          items: { include: { tag: true } },
        },
      }),
      this.prisma.transfer.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, user: { id: string; role: string; locationId?: string }) {
    const transfer = await this.prisma.transfer.findUnique({
      where: { id },
      include: {
        source: true,
        destination: true,
        createdBy: { select: { username: true } },
        items: { include: { tag: true } },
      },
    });
    if (!transfer) throw new NotFoundException('Không tìm thấy transfer');

    if (user.role === 'WAREHOUSE_MANAGER' && user.locationId) {
      if (transfer.sourceId !== user.locationId && transfer.destinationId !== user.locationId) {
        throw new ForbiddenException('Không có quyền truy cập phiếu luân chuyển này');
      }
    }

    return transfer;
  }

  async cancel(id: string, user: { id: string; role: string; locationId?: string }) {
    const transfer = await this.prisma.transfer.findUnique({ 
      where: { id },
      include: { source: true, items: true }
    });
    if (!transfer) throw new NotFoundException('Không tìm thấy transfer');
    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException('Chỉ transfer PENDING mới có thể hủy');
    }

    if (user.role === 'WAREHOUSE_MANAGER' && user.locationId) {
      if (transfer.sourceId !== user.locationId) {
        throw new ForbiddenException('Bạn không có quyền hủy phiếu này');
      }
    }

    // REVERT Tag statuses and locations back to source location
    const targetStatus = transfer.source?.type === 'WORKSHOP' ? TagStatus.IN_WORKSHOP : TagStatus.IN_WAREHOUSE;
    
    if (transfer.items.length > 0) {
      await this.prisma.tag.updateMany({
        where: { id: { in: transfer.items.map(i => i.tagId) } },
        data: {
          status: targetStatus,
          locationId: transfer.sourceId,
        }
      });
    }

    const cancelledTransfer = await this.prisma.transfer.update({
      where: { id },
      data: { status: TransferStatus.CANCELLED },
      include: {
        source: true,
        destination: true,
        createdBy: { select: { username: true } },
        items: { include: { tag: true } },
      },
    });

    this.events.server.emit('transferUpdate', cancelledTransfer);
    return cancelledTransfer;
  }

  async updateDestination(id: string, destinationId: string, user: { id: string; role: string; locationId?: string }) {
    const transfer = await this.prisma.transfer.findUnique({
      where: { id },
      include: { source: true }
    });
    
    if (!transfer) throw new NotFoundException('Không tìm thấy transfer');
    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException('Chỉ transfer ở trạng thái PENDING mới có thể chỉnh sửa xưởng nhận.');
    }

    const newDest = await this.prisma.location.findUnique({ where: { id: destinationId } });
    if (!newDest) throw new NotFoundException('Vị trí đích mới không tồn tại');

    if (transfer.type === 'ADMIN_TO_WORKSHOP' && newDest.type !== LocationType.WORKSHOP) {
      throw new BadRequestException('Vị trí đích phải là WORKSHOP');
    } else if (transfer.type === 'WORKSHOP_TO_WAREHOUSE' && newDest.type !== LocationType.WAREHOUSE) {
      throw new BadRequestException('Vị trí đích phải là WAREHOUSE');
    } else if (transfer.type === 'WAREHOUSE_TO_CUSTOMER' && !['HOTEL', 'RESORT', 'SPA', 'CUSTOMER'].includes(newDest.type)) {
      throw new BadRequestException('Vị trí đích phải là khách hàng (HOTEL, RESORT, SPA)');
    }

    const updatedTransfer = await this.prisma.transfer.update({
      where: { id },
      data: { destinationId },
      include: {
        source: true,
        destination: true,
        createdBy: { select: { username: true } },
        items: { include: { tag: true } },
      },
    });

    this.events.server.emit('transferUpdate', updatedTransfer);
    return updatedTransfer;
  }
}
