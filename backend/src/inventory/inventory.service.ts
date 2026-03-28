import { Injectable, HttpStatus, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@prisma/prisma.service';
import { InventoryAction, InventoryOperationDto } from './dto/inventory-operation.dto';
import { TagStatus } from '.prisma/client';
import { BusinessException } from '@common/exceptions/business.exception';
import { PaginationHelper } from '@common/helpers/pagination.helper';
import { plainToInstance } from 'class-transformer';
import { ActivityLogEntity } from '../activity-log/entities/activity-log.entity';
import { TAGS_UPDATED_EVENT } from '@common/interfaces/scan.interface';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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

    // Emit real-time update via EventEmitter2 (D-01, D-03)
    this.eventEmitter.emit(TAGS_UPDATED_EVENT);

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
    return PaginationHelper.paginate(formattedData, total, page, limit);
  }

  /**
   * BATCH-05: Bulk upsert for batch scan operations
   * BATCH-06: Idempotency via Prisma upsert - duplicates handled gracefully
   *
   * Real upsert behavior:
   * - New EPC → creates tag with status IN_STOCK
   * - Existing EPC → updates lastSeenAt timestamp (records scan visibility event)
   */
  async processBulkScan(epcs: string[], userId: string = 'system'): Promise<{ created: number; updated: number }> {
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

    // Process in chunks to avoid overwhelming the DB
    const CHUNK_SIZE = 100;
    const now = new Date();

    // Create new tags (upsert - only creates because we already checked they don't exist)
    for (let i = 0; i < toCreate.length; i += CHUNK_SIZE) {
      const chunk = toCreate.slice(i, i + CHUNK_SIZE);
      await this.prisma.tag.createMany({
        data: chunk.map((epc) => ({ epc, status: 'IN_STOCK', lastSeenAt: now })),
      });
      created += chunk.length;
    }

    // Update existing tags via upsert (records scan visibility event)
    for (let i = 0; i < toUpdate.length; i += CHUNK_SIZE) {
      const chunk = toUpdate.slice(i, i + CHUNK_SIZE);
      // Prisma: upsert is per-record, run in parallel for speed
      const results = await Promise.all(
        chunk.map((epc) =>
          this.prisma.tag.update({
            where: { epc },
            data: { lastSeenAt: now },
          }),
        ),
      );
      updated += results.length;
    }

    // Activity logging for bulk scan operation
    if (uniqueEpcs.length > 0) {
      await this.prisma.activityLog.create({
        data: {
          action: 'BATCH_SCAN',
          entity: 'Tag',
          entityId: uniqueEpcs.slice(0, 10).join(',') + (uniqueEpcs.length > 10 ? '...' : ''),
          details: {
            action: 'BATCH_SCAN',
            tagCount: uniqueEpcs.length,
            created,
            updated,
            note: `Batch scan processed ${uniqueEpcs.length} tags (${created} created, ${updated} updated)`,
            tags: uniqueEpcs.slice(0, 5).map((epc) => ({ epc })),
          },
          userId,
        },
      });
    }

    // Invalidate inventory summary cache (CACHE-05 pattern)
    await this.cacheManager.del('inventory:summary');

    return { created, updated };
  }
}
