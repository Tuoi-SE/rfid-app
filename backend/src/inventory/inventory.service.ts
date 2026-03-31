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
      dto.action === InventoryAction.CHECK_IN ? TagStatus.IN_WAREHOUSE : TagStatus.COMPLETED;

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

    // 1.1 In-stock tags grouped by physical location type
    // Helps FE separate "Kho Admin" vs "Kho Trung Tâm" vs "Xưởng"
    const stockTagsByLocation = await this.prisma.tag.findMany({
      where: {
        deletedAt: null,
        status: { in: [TagStatus.IN_WAREHOUSE, TagStatus.IN_WORKSHOP] },
        locationId: { not: null },
      },
      select: {
        locationRel: {
          select: { type: true },
        },
      },
    });

    const locationTypeCounts = stockTagsByLocation.reduce<Record<string, number>>((acc, row) => {
      const locationType = row.locationRel?.type;
      if (!locationType) return acc;
      acc[locationType] = (acc[locationType] || 0) + 1;
      return acc;
    }, {});

    const adminInStock = locationTypeCounts.ADMIN || 0;
    const workshopInStock = locationTypeCounts.WORKSHOP || 0;
    const workshopWarehouseInStock = locationTypeCounts.WORKSHOP_WAREHOUSE || 0;
    const warehouseInStock = locationTypeCounts.WAREHOUSE || 0;
    const totalTrackedInStock =
      adminInStock +
      workshopInStock +
      workshopWarehouseInStock +
      warehouseInStock;
    const allInStockAtAdmin =
      totalTrackedInStock > 0 && adminInStock === totalTrackedInStock;

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
      const inStock = p.tags.filter((t) => t.status === 'IN_WAREHOUSE' || t.status === 'IN_WORKSHOP').length;
      const outOfStock = p.tags.filter((t) => t.status === 'COMPLETED').length;
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
        inStock: allTags.filter((t) => t.status === 'IN_WAREHOUSE' || t.status === 'IN_WORKSHOP').length,
        outOfStock: allTags.filter((t) => t.status === 'COMPLETED').length,
      };
    });

    // 4. Per-location breakdown (drill-down by workshop / workshop warehouse / warehouse)
    const locationStatusCounts = await this.prisma.tag.groupBy({
      by: ['locationId', 'status'],
      where: {
        deletedAt: null,
        locationId: { not: null },
      },
      _count: { _all: true },
    });

    const locationProductCounts = await this.prisma.tag.groupBy({
      by: ['locationId', 'productId'],
      where: {
        deletedAt: null,
        locationId: { not: null },
        productId: { not: null },
      },
      _count: { _all: true },
    });

    const locationIds = Array.from(
      new Set(
        locationStatusCounts
          .map((row) => row.locationId)
          .filter((id): id is string => typeof id === 'string' && id.length > 0),
      ),
    );

    const locations = locationIds.length
      ? await this.prisma.location.findMany({
          where: {
            id: { in: locationIds },
            deletedAt: null,
          },
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
            parent: { select: { id: true, name: true, type: true } },
          },
        })
      : [];

    const locationById = new Map(locations.map((loc) => [loc.id, loc]));

    const productIds = Array.from(
      new Set(
        locationProductCounts
          .map((row) => row.productId)
          .filter((id): id is string => typeof id === 'string' && id.length > 0),
      ),
    );

    const locationProducts = productIds.length
      ? await this.prisma.product.findMany({
          where: { id: { in: productIds } },
          select: {
            id: true,
            name: true,
            sku: true,
            category: { select: { name: true } },
          },
        })
      : [];
    const productById = new Map(
      locationProducts.map((product) => [product.id, product]),
    );

    const locationStatMap = new Map<
      string,
      {
        id: string;
        code: string;
        name: string;
        type: string;
        parent?: { id: string; name: string; type: string } | null;
        totalTags: number;
        inStock: number;
        inTransit: number;
        missing: number;
        completed: number;
        unassigned: number;
        productKinds: number;
        topProducts: Array<{
          id: string;
          name: string;
          sku: string;
          category: string;
          count: number;
        }>;
      }
    >();

    for (const row of locationStatusCounts) {
      if (!row.locationId) continue;
      const locationInfo = locationById.get(row.locationId);
      if (!locationInfo) continue;

      if (!locationStatMap.has(row.locationId)) {
        locationStatMap.set(row.locationId, {
          id: locationInfo.id,
          code: locationInfo.code,
          name: locationInfo.name,
          type: locationInfo.type,
          parent: locationInfo.parent
            ? {
                id: locationInfo.parent.id,
                name: locationInfo.parent.name,
                type: locationInfo.parent.type,
              }
            : null,
          totalTags: 0,
          inStock: 0,
          inTransit: 0,
          missing: 0,
          completed: 0,
          unassigned: 0,
          productKinds: 0,
          topProducts: [],
        });
      }

      const item = locationStatMap.get(row.locationId)!;
      const count = row._count._all || 0;
      item.totalTags += count;

      if (row.status === TagStatus.IN_WAREHOUSE || row.status === TagStatus.IN_WORKSHOP) {
        item.inStock += count;
      } else if (row.status === TagStatus.IN_TRANSIT) {
        item.inTransit += count;
      } else if (row.status === TagStatus.MISSING) {
        item.missing += count;
      } else if (row.status === TagStatus.COMPLETED) {
        item.completed += count;
      } else if (row.status === TagStatus.UNASSIGNED) {
        item.unassigned += count;
      }
    }

    for (const row of locationProductCounts) {
      if (!row.locationId || !row.productId) continue;
      const locationStat = locationStatMap.get(row.locationId);
      const product = productById.get(row.productId);
      if (!locationStat || !product) continue;

      locationStat.topProducts.push({
        id: product.id,
        name: product.name,
        sku: product.sku || 'N/A',
        category: product.category?.name || '—',
        count: row._count._all || 0,
      });
    }

    const locationBreakdown = Array.from(locationStatMap.values())
      .map((item) => {
        const sortedProducts = [...item.topProducts].sort((a, b) => b.count - a.count);
        return {
          ...item,
          productKinds: sortedProducts.length,
          topProducts: sortedProducts.slice(0, 8),
          remainingProductKinds: Math.max(sortedProducts.length - 8, 0),
        };
      })
      .sort((a, b) => b.totalTags - a.totalTags);

    return {
      overview: {
        totalTags,
        unassignedTags,
        statuses: Object.fromEntries(
          statusCounts.map((s) => [s.status, s._count._all]),
        ),
        locationTypeCounts,
        flow: {
          adminInStock,
          workshopInStock,
          workshopWarehouseInStock,
          warehouseInStock,
          allInStockAtAdmin,
        },
      },
      productBreakdown,
      categoryBreakdown,
      locationBreakdown,
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
   * - New EPC → creates tag with status UNASSIGNED
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
        data: chunk.map((epc) => ({ epc, status: TagStatus.UNASSIGNED, lastSeenAt: now })),
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
