import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { ConfirmTransferDto } from './dto/confirm-transfer.dto';
import { QueryTransfersDto } from './dto/query-transfers.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TRANSFER_UPDATED_EVENT } from '@common/interfaces/scan.interface';
import { TransferValidationService } from './transfer-validation.service';
import { TransferLocationService } from './transfer-location.service';
import { randomBytes } from 'crypto';
import {
  LocationType,
  TransferStatus,
  TagStatus,
  Prisma,
} from '@prisma/client';

@Injectable()
export class TransfersService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private transferValidation: TransferValidationService,
    private transferLocation: TransferLocationService,
  ) {}

  async create(
    dto: CreateTransferDto,
    user: { id: string; role: string; locationId?: string },
  ) {
    // Validate source location based on transfer type (per D-12)
    const source = await this.prisma.location.findUnique({
      where: { id: dto.sourceId },
    });
    if (!source) throw new NotFoundException('Không tìm thấy vị trí nguồn');

    // Validate destination location based on transfer type (per D-13)
    const destination = await this.prisma.location.findUnique({
      where: { id: dto.destinationId },
    });
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
      if (source.type !== LocationType.WORKSHOP_WAREHOUSE) {
        throw new BadRequestException('Vị trí xuất điều chuyển bắt buộc phải là Kho Xưởng (không được xuất trực tiếp từ Xưởng)');
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
        throw new BadRequestException(
          'Vị trí đích phải là HOTEL, RESORT, hoặc SPA',
        );
      }
    } else {
      throw new BadRequestException('Loại transfer không hợp lệ');
    }

    // Hard-rule validation across full history/current state before creating transfer
    const { acceptedTagIds: validatedTagIds } = await this.transferValidation.validateTagsForCreateTransfer(
      dto.tagIds,
      dto,
      user,
    );

    // Generate unique code: TRF-{timestamp}-{random}
    const code = `TRF-${Date.now().toString().slice(-6)}-${randomBytes(2).toString('hex').toUpperCase()}`;

    // D-20: WAREHOUSE_TO_CUSTOMER - 1-step workflow (tạo = COMPLETED ngay)
    const isWarehouseToCustomer = dto.type === 'WAREHOUSE_TO_CUSTOMER';

    // Create transfer - WAREHOUSE_TO_CUSTOMER created as COMPLETED immediately
    const transfer = await this.prisma.transfer.create({
      data: {
        code,
        type: dto.type,
        status: isWarehouseToCustomer
          ? TransferStatus.COMPLETED
          : TransferStatus.PENDING,
        sourceId: dto.sourceId,
        destinationId: dto.destinationId,
        createdById: user.id,
        completedAt: isWarehouseToCustomer ? new Date() : null, // D-20: set completedAt immediately
        items: {
          create: validatedTagIds.map((tagId) => ({
            tagId,
            scannedAt: isWarehouseToCustomer ? new Date() : null, // D-20: Mark as scanned
            condition: isWarehouseToCustomer ? 'GOOD' : undefined,
          })),
        },
      },
      include: {
        source: true,
        destination: true,
        createdBy: { select: { id: true, username: true, role: true } },
        items: { include: { tag: true } },
      },
    });

    // D-20: WAREHOUSE_TO_CUSTOMER - update tags immediately to COMPLETED
    if (isWarehouseToCustomer) {
      // D-19: Tags at customer get OUT_OF_STOCK status
      await this.prisma.tag.updateMany({
        where: { id: { in: validatedTagIds } },
        data: {
          locationId: dto.destinationId,
          status: TagStatus.COMPLETED,
        },
      });
      this.eventEmitter.emit(TRANSFER_UPDATED_EVENT, transfer);
      return transfer;
    }

    // UPDATE: Set tag status to IN_TRANSIT and locationId to null
    await this.prisma.tag.updateMany({
      where: { id: { in: validatedTagIds } },
      data: {
        status: TagStatus.IN_TRANSIT,
        locationId: null,
      },
    });

    this.eventEmitter.emit(TRANSFER_UPDATED_EVENT, transfer);
    return transfer;
  }

  async confirm(
    transferId: string,
    dto: ConfirmTransferDto,
    user: { id: string; role: string; locationId?: string },
  ) {
    const transfer = await this.prisma.transfer.findUnique({
      where: { id: transferId },
      include: { items: { include: { tag: true } }, destination: true },
    });

    if (!transfer) throw new NotFoundException('Không tìm thấy transfer');

    // LBAC check for WAREHOUSE_MANAGER
    if (user.role === 'WAREHOUSE_MANAGER') {
      const allowedIds = await this.transferLocation.getAuthorizedLocationIds(user.locationId);
      if (
        (!transfer.sourceId || !allowedIds.includes(transfer.sourceId)) ||
        (!transfer.destinationId || !allowedIds.includes(transfer.destinationId))
      ) {
        throw new ForbiddenException(
          'Không có quyền xác nhận phiếu điều chuyển này',
        );
      }
    }

    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException('Transfer không ở trạng thái PENDING');
    }

    // Identify scanned tags vs missing tags
    let scannedTagIds: string[] = [];
    let missingTagIds: string[] = [];
    const isWarehouseToCustomer = transfer.type === 'WAREHOUSE_TO_CUSTOMER';

    if (dto.scans && dto.scans.length > 0) {
      const scannedEpcs = dto.scans.map((s) => s.epc);
      const scannedItems = transfer.items.filter((item) =>
        scannedEpcs.includes(item.tag.epc),
      );
      const missingItems = transfer.items.filter(
        (item) => !scannedEpcs.includes(item.tag.epc),
      );

      scannedTagIds = scannedItems.map((i) => i.tagId);
      missingTagIds = missingItems.map((i) => i.tagId);
    } else {
      // Auto-receive everything if no specific scans provided (manual confirm bypass)
      scannedTagIds = transfer.items.map((i) => i.tagId);
      missingTagIds = [];
    }

    // Determine target location status
    const targetStatus = isWarehouseToCustomer
      ? TagStatus.COMPLETED
      : transfer.destination.type === 'WORKSHOP'
        ? TagStatus.IN_WORKSHOP
        : transfer.destination.type === 'WAREHOUSE'
          ? TagStatus.IN_WAREHOUSE
          : TagStatus.IN_TRANSIT;

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
        createdBy: { select: { id: true, username: true, role: true } },
        items: { include: { tag: true } },
      },
    });

    this.eventEmitter.emit(TRANSFER_UPDATED_EVENT, completedTransfer);
    return completedTransfer;
  }

  async findAll(
    query: QueryTransfersDto,
    user: { id: string; role: string; locationId?: string },
  ) {
    const {
      page = 1,
      limit = 20,
      status,
      type,
      sourceId,
      destinationId,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TransferWhereInput = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (sourceId) where.sourceId = sourceId;
    if (destinationId) where.destinationId = destinationId;

    if (user.role === 'WAREHOUSE_MANAGER') {
      const allowedIds = await this.transferLocation.getAuthorizedLocationIds(user.locationId);
      if (allowedIds.length > 0) {
        where.OR = [
          { sourceId: { in: allowedIds } },
          { destinationId: { in: allowedIds } },
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
          createdBy: { select: { id: true, username: true, role: true } },
          items: { include: { tag: true } },
        },
      }),
      this.prisma.transfer.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(
    id: string,
    user: { id: string; role: string; locationId?: string },
  ) {
    const transfer = await this.prisma.transfer.findUnique({
      where: { id },
      include: {
        source: true,
        destination: true,
        createdBy: { select: { id: true, username: true, role: true } },
        items: { include: { tag: true } },
      },
    });
    if (!transfer) throw new NotFoundException('Không tìm thấy transfer');

    if (user.role === 'WAREHOUSE_MANAGER') {
      const allowedIds = await this.transferLocation.getAuthorizedLocationIds(user.locationId);
      if (
        (!transfer.sourceId || !allowedIds.includes(transfer.sourceId)) &&
        (!transfer.destinationId ||
          !allowedIds.includes(transfer.destinationId))
      ) {
        throw new ForbiddenException(
          'Không có quyền truy cập phiếu luân chuyển này',
        );
      }
    }

    return transfer;
  }

  async cancel(
    id: string,
    user: { id: string; role: string; locationId?: string },
  ) {
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Chỉ ADMIN và SUPER_ADMIN có quyền hủy phiếu điều chuyển.',
      );
    }

    const transfer = await this.prisma.transfer.findUnique({
      where: { id },
      include: { source: true, items: true },
    });
    if (!transfer) throw new NotFoundException('Không tìm thấy transfer');

    if (
      transfer.status !== TransferStatus.PENDING &&
      transfer.status !== TransferStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Chỉ transfer PENDING hoặc COMPLETED mới có thể hủy',
      );
    }

    // REVERT Tag statuses and locations back to source location
    const targetStatus =
      transfer.source?.type === 'WORKSHOP'
        ? TagStatus.IN_WORKSHOP
        : TagStatus.IN_WAREHOUSE;

    if (transfer.items.length > 0) {
      await this.prisma.tag.updateMany({
        where: { id: { in: transfer.items.map((i) => i.tagId) } },
        data: {
          status: targetStatus,
          locationId: transfer.sourceId,
        },
      });
    }

    const cancelledTransfer = await this.prisma.transfer.update({
      where: { id },
      data: {
        status: TransferStatus.CANCELLED,
        completedAt: null,
      },
      include: {
        source: true,
        destination: true,
        createdBy: { select: { id: true, username: true, role: true } },
        items: { include: { tag: true } },
      },
    });

    this.eventEmitter.emit(TRANSFER_UPDATED_EVENT, cancelledTransfer);
    return cancelledTransfer;
  }

  async updateDestination(
    id: string,
    destinationId: string,
    user: { id: string; role: string; locationId?: string },
  ) {
    if (user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Chỉ SUPER_ADMIN mới được chỉnh sửa xưởng nhận của phiếu luân chuyển.',
      );
    }

    const transfer = await this.prisma.transfer.findUnique({
      where: { id },
      include: { source: true, items: true },
    });

    if (!transfer) throw new NotFoundException('Không tìm thấy transfer');

    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException(
        'Chỉ transfer ở trạng thái PENDING mới có thể chỉnh sửa xưởng nhận.',
      );
    }

    const newDest = await this.prisma.location.findUnique({
      where: { id: destinationId },
    });
    if (!newDest) throw new NotFoundException('Vị trí đích mới không tồn tại');

    if (
      transfer.type === 'ADMIN_TO_WORKSHOP' &&
      newDest.type !== LocationType.WORKSHOP
    ) {
      throw new BadRequestException('Vị trí đích phải là WORKSHOP');
    } else if (
      transfer.type === 'WORKSHOP_TO_WAREHOUSE' &&
      newDest.type !== LocationType.WAREHOUSE
    ) {
      throw new BadRequestException('Vị trí đích phải là WAREHOUSE');
    } else if (
      transfer.type === 'WAREHOUSE_TO_CUSTOMER' &&
      !['HOTEL', 'RESORT', 'SPA', 'CUSTOMER'].includes(newDest.type)
    ) {
      throw new BadRequestException(
        'Vị trí đích phải là khách hàng (HOTEL, RESORT, SPA)',
      );
    }

    const updatedTransfer = await this.prisma.transfer.update({
      where: { id },
      data: { destinationId },
      include: {
        source: true,
        destination: true,
        createdBy: { select: { id: true, username: true, role: true } },
        items: { include: { tag: true } },
      },
    });

    this.eventEmitter.emit(TRANSFER_UPDATED_EVENT, updatedTransfer);
    return updatedTransfer;
  }
}
