import { Injectable, HttpStatus } from '@nestjs/common';
import { CacheService } from '@nestjs/cache-manager';
import { PrismaService } from '@prisma/prisma.service';
import { InventoryAction, InventoryOperationDto } from './dto/inventory-operation.dto';
import { EventsGateway } from '../events/events.gateway';
import { TagStatus } from '.prisma/client';
import { BusinessException } from '@common/exceptions/business.exception';
import { paginate } from '@common/helpers/pagination.helper';
import { plainToInstance } from 'class-transformer';
import { ActivityLogEntity } from '../activity-log/entities/activity-log.entity';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private cacheManager: CacheService,
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
      throw new BusinessException('Không tìm thấy tag nào với các mã đã cung cấp', 'TAG_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    // Validate: don't check-in tags already IN_STOCK, etc.
    const alreadyCorrectStatus = tags.filter((t) => t.status === targetStatus);
    const toUpdate = tags.filter((t) => t.status !== targetStatus);

    if (toUpdate.length === 0) {
      throw new BusinessException(
        `Tất cả ${tags.length} tag đã ở trạng thái ${targetStatus}`,
        'INVALID_STATUS',
        HttpStatus.BAD_REQUEST
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

    // Invalidate inventory summary cache after successful operation
    await this.cacheManager.del('inventory:summary');

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
    const cacheKey = 'inventory:summary';

    // Try cache first (cache-aside pattern)
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached as ReturnType<typeof this.buildStockSummary>;
    }

    // Cache miss - build summary from database
    const result = await this.buildStockSummary();

    // Populate cache with 30-sec TTL + jitter (5-10% to prevent stampede)
    const jitter = Math.floor(30000 * (Math.random() * 0.1)); // 0-10% of 30sec
    await this.cacheManager.set(cacheKey, result, 30000 + jitter);

    return result;
  }

  private async buildStockSummary() {
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

    const formattedData = data.map((i) => plainToInstance(ActivityLogEntity, i));
    return paginate(formattedData, total, page, limit);
  }

  /**
   * BATCH-05: Bulk upsert for batch scan operations
   * BATCH-06: Idempotency via Prisma upsert - duplicates handled gracefully
   */
  async processBulkScan(epcs: string[]): Promise<{ created: number; updated: number }> {
    if (!epcs?.length) {
      return { created: 0, updated: 0 };
    }

    // Deduplicate EPCs (BATCH-06: idempotency)
    const uniqueEpcs = [...new Set(epcs)];

    // Fetch existing tags
    const existingTags = await this.prisma.tag.findMany({
      where: { epc: { in: uniqueEpcs } },
      select: { epc: true },
    });
    const existingEpcs = new Set(existingTags.map((t) => t.epc));

    // Separate into to-create and to-update
    const toCreate = uniqueEpcs.filter((epc) => !existingEpcs.has(epc));
    const toUpdate = uniqueEpcs.filter((epc) => existingEpcs.has(epc));

    let created = 0;
    let updated = 0;

    // D-08: Upsert handles duplicates gracefully (BATCH-06 idempotency)
    // Process in chunks to avoid overwhelming the DB
    const CHUNK_SIZE = 100;
    for (let i = 0; i < toCreate.length; i += CHUNK_SIZE) {
      const chunk = toCreate.slice(i, i + CHUNK_SIZE);
      await this.prisma.tag.createMany({
        data: chunk.map((epc) => ({ epc, status: 'IN_STOCK' })),
        skipDuplicates: true,
      });
      created += chunk.length;
    }

    // Tags found in buffer but not in DB are considered IN_STOCK (auto-created above)
    // No status update needed for existing tags during batch scan (BATCH-06: scan = visibility, not status change)

    // BATCH-06: Activity logging for bulk scan operation
    if (uniqueEpcs.length > 0) {
      await this.prisma.activityLog.create({
        data: {
          action: 'BATCH_SCAN',
          entity: 'Tag',
          entityId: uniqueEpcs.slice(0, 10).join(',') + (uniqueEpcs.length > 10 ? '...' : ''),
          details: {
            action: 'BATCH_SCAN',
            tagCount: uniqueEpcs.length,
            note: `Batch scan processed ${uniqueEpcs.length} tags`,
            tags: uniqueEpcs.slice(0, 5).map((epc) => ({ epc })), // First 5 for logging
          },
        },
      });
    }

    // Invalidate inventory summary cache (CACHE-05 pattern)
    await this.cacheManager.del('inventory:summary');

    return { created, updated };
  }
}
