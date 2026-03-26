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
    // Validate source is ADMIN location
    const source = await this.prisma.location.findUnique({ where: { id: dto.sourceId } });
    if (!source) throw new NotFoundException('Không tìm thấy vị trí nguồn');
    if (source.type !== LocationType.ADMIN) {
      throw new BadRequestException('Vị trí nguồn phải là ADMIN');
    }

    // Validate destination is WORKSHOP location
    const destination = await this.prisma.location.findUnique({ where: { id: dto.destinationId } });
    if (!destination) throw new NotFoundException('Không tìm thấy vị trí đích');
    if (destination.type !== LocationType.WORKSHOP) {
      throw new BadRequestException('Vị trí đích phải là WORKSHOP');
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
        type: 'ADMIN_TO_WORKSHOP',
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

    // Validate user role is WAREHOUSE_MANAGER (per D-08)
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user.role !== Role.WAREHOUSE_MANAGER) {
      throw new ForbiddenException('Chỉ Warehouse Manager mới có thể xác nhận transfer');
    }

    // Update all tags: locationRel = destination workshop, status = IN_STOCK (per D-09, D-11)
    await this.prisma.tag.updateMany({
      where: { id: { in: transfer.items.map(item => item.tagId) } },
      data: {
        locationId: transfer.destinationId,
        status: TagStatus.IN_STOCK,
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
