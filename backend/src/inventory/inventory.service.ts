import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryAction, InventoryOperationDto } from './dto/inventory-operation.dto';
import { EventsGateway } from '../events/events.gateway';
import { TagStatus } from '.prisma/client';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  async processOperation(dto: InventoryOperationDto, userId: string) {
    const targetStatus: TagStatus =
      dto.action === InventoryAction.CHECK_IN ? 'IN_STOCK' : 'OUT_OF_STOCK';

    // Find tags by ID or EPC
    const tags = await this.prisma.tag.findMany({
      where: {
        OR: [
          { id: { in: dto.tagIdentifiers } },
          { epc: { in: dto.tagIdentifiers } },
        ],
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
      },
    });

    if (tags.length === 0) {
      throw new NotFoundException('Không tìm thấy tag nào với các mã đã cung cấp');
    }

    // Validate: don't check-in tags already IN_STOCK, etc.
    const alreadyCorrectStatus = tags.filter((t) => t.status === targetStatus);
    const toUpdate = tags.filter((t) => t.status !== targetStatus);

    if (toUpdate.length === 0) {
      throw new BadRequestException(
        `Tất cả ${tags.length} tag đã ở trạng thái ${targetStatus}`,
      );
    }

    // Batch update statuses
    await this.prisma.tag.updateMany({
      where: { id: { in: toUpdate.map((t) => t.id) } },
      data: { status: targetStatus },
    });

    // Log the operation
    await this.prisma.activityLog.create({
      data: {
        action: dto.action,
        entity: 'Tag',
        entityId: toUpdate.map((t) => t.id).join(','),
        details: {
          action: dto.action,
          tagCount: toUpdate.length,
          note: dto.note || null,
          tags: toUpdate.map((t) => ({
            id: t.id,
            epc: t.epc,
            previousStatus: t.status,
            newStatus: targetStatus,
            product: t.product?.name || null,
          })),
        },
        userId,
      },
    });

    // Emit real-time update
    this.eventsGateway.emitTagsUpdated();

    return {
      action: dto.action,
      processed: toUpdate.length,
      skipped: alreadyCorrectStatus.length,
      tags: toUpdate.map((t) => ({
        id: t.id,
        epc: t.epc,
        previousStatus: t.status,
        newStatus: targetStatus,
        product: t.product,
      })),
    };
  }

  async getStockSummary() {
    // 1. Overall status counts
    const statusCounts = await this.prisma.tag.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    const totalTags = await this.prisma.tag.count();
    const unassignedTags = await this.prisma.tag.count({ where: { productId: null } });

    // 2. Per-product breakdown
    const products = await this.prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        category: { select: { name: true } },
        tags: { select: { status: true } },
      },
      orderBy: { name: 'asc' },
    });

    const productBreakdown = products.map((p) => {
      const inStock = p.tags.filter((t) => t.status === 'IN_STOCK').length;
      const outOfStock = p.tags.filter((t) => t.status === 'OUT_OF_STOCK').length;
      const inTransit = p.tags.filter((t) => t.status === 'IN_TRANSIT').length;
      const missing = p.tags.filter((t) => t.status === 'MISSING').length;
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category?.name || '—',
        total: p.tags.length,
        inStock,
        outOfStock,
        inTransit,
        missing,
      };
    });

    // 3. Per-category summary
    const categories = await this.prisma.category.findMany({
      select: {
        name: true,
        products: {
          select: { tags: { select: { status: true } } },
        },
      },
    });

    const categoryBreakdown = categories.map((c) => {
      const allTags = c.products.flatMap((p) => p.tags);
      return {
        name: c.name,
        total: allTags.length,
        inStock: allTags.filter((t) => t.status === 'IN_STOCK').length,
        outOfStock: allTags.filter((t) => t.status === 'OUT_OF_STOCK').length,
      };
    });

    return {
      overview: {
        totalTags,
        unassignedTags,
        statuses: Object.fromEntries(
          statusCounts.map((s) => [s.status, s._count._all]),
        ),
      },
      productBreakdown,
      categoryBreakdown,
    };
  }

  async getHistory(page = 1, limit = 20) {
    const where = {
      action: { in: [InventoryAction.CHECK_IN, InventoryAction.CHECK_OUT] },
    };

    const [data, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { id: true, username: true } } },
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}
