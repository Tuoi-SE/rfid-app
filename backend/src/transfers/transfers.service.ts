import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { ConfirmTransferDto } from './dto/confirm-transfer.dto';
import { QueryTransfersDto } from './dto/query-transfers.dto';
import { EventsGateway } from '../events/events.gateway';
import { randomBytes } from 'crypto';
import { LocationType, TransferStatus, TagStatus, Role } from '@prisma/client';

@Injectable()
export class TransfersService {
  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
  ) {}

  async create(dto: CreateTransferDto, userId: string) {
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

    // Create transfer with items
    const transfer = await this.prisma.transfer.create({
      data: {
        code,
        type: dto.type,
        status: TransferStatus.PENDING,
        sourceId: dto.sourceId,
        destinationId: dto.destinationId,
        createdById: userId,
        items: {
          create: dto.tagIds.map(tagId => ({
            tagId,
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

    this.events.server.emit('transferUpdate', transfer);
    return transfer;
  }

  async confirm(transferId: string, dto: ConfirmTransferDto, userId: string) {
    const transfer = await this.prisma.transfer.findUnique({
      where: { id: transferId },
      include: { items: true, destination: true },
    });

    if (!transfer) throw new NotFoundException('Không tìm thấy transfer');
    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException('Transfer không ở trạng thái PENDING');
    }

    // D-14: Check scanned count before COMPLETED - all tags must be scanned
    const scannedCount = transfer.items.filter(item => item.scannedAt !== null).length;
    if (scannedCount < transfer.items.length) {
      throw new BadRequestException(
        `Đã quét ${scannedCount}/${transfer.items.length} tag. Phải quét đủ số lượng mới được xác nhận.`
      );
    }

    // Validate user role is WAREHOUSE_MANAGER (per D-08)
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== Role.WAREHOUSE_MANAGER) {
      throw new ForbiddenException('Chỉ Warehouse Manager mới có thể xác nhận transfer');
    }

    // D-19: Update all tags: locationId = destination
    // For WAREHOUSE_TO_CUSTOMER: status = OUT_OF_STOCK (đã xuất cho customer)
    // For other transfers: status = IN_STOCK
    const isWarehouseToCustomer = transfer.type === 'WAREHOUSE_TO_CUSTOMER';
    await this.prisma.tag.updateMany({
      where: { id: { in: transfer.items.map(item => item.tagId) } },
      data: {
        locationId: transfer.destinationId,
        status: isWarehouseToCustomer ? TagStatus.OUT_OF_STOCK : TagStatus.IN_STOCK,
      },
    });

    // Mark items as scanned
    await this.prisma.transferItem.updateMany({
      where: { transferId },
      data: {
        scannedAt: new Date(),
        condition: 'GOOD',
      },
    });

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

  async findAll(query: QueryTransfersDto) {
    const { page = 1, limit = 20, status, type, sourceId, destinationId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (sourceId) where.sourceId = sourceId;
    if (destinationId) where.destinationId = destinationId;

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

  async findOne(id: string) {
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
    return transfer;
  }

  async cancel(id: string, userId: string) {
    const transfer = await this.prisma.transfer.findUnique({ where: { id } });
    if (!transfer) throw new NotFoundException('Không tìm thấy transfer');
    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException('Chỉ transfer PENDING mới có thể hủy');
    }

    return this.prisma.transfer.update({
      where: { id },
      data: { status: TransferStatus.CANCELLED },
      include: {
        source: true,
        destination: true,
        createdBy: { select: { username: true } },
        items: { include: { tag: true } },
      },
    });
  }
}
