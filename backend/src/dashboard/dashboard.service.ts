import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { TagStatus } from '.prisma/client';
import { plainToInstance } from 'class-transformer';
import { GenericReportEntity } from './entities/dashboard.entity';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private activityLogService: ActivityLogService,
  ) {}

  async getSummary() {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalProducts,
      totalTags,
      totalCategories,
      totalUsers,
      tagsByStatus,
      recentScansCount,
      productsByCategory,
      recentActivity,
    ] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.tag.count(),
      this.prisma.category.count(),
      this.prisma.user.count(),
      this.getTagsByStatus(),
      this.prisma.scan.count({ where: { scannedAt: { gte: last24h } } }),
      this.getProductsByCategory(),
      this.activityLogService.getRecentActivity(10),
    ]);

    return plainToInstance(GenericReportEntity, {
      totalProducts,
      totalTags,
      totalCategories,
      totalUsers,
      tagsByStatus,
      recentScans: recentScansCount,
      productsByCategory,
      recentActivity,
    });
  }

  private async getTagsByStatus() {
    const statuses = Object.values(TagStatus);
    const counts = await Promise.all(
      statuses.map(async (status) => ({
        status,
        count: await this.prisma.tag.count({ where: { status } }),
      })),
    );
    return Object.fromEntries(counts.map((c) => [c.status, c.count]));
  }

  private async getProductsByCategory() {
    const categories = await this.prisma.category.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });

    return categories.map((c) => ({
      category: c.name,
      categoryId: c.id,
      count: c._count.products,
    }));
  }
}
