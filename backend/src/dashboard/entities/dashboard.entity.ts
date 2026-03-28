import { Expose, Type } from 'class-transformer';

export class GenericReportEntity {
  @Expose({ name: 'total_products' })
  totalProducts!: number;

  @Expose({ name: 'total_tags' })
  totalTags!: number;

  @Expose({ name: 'total_categories' })
  totalCategories!: number;

  @Expose({ name: 'total_users' })
  totalUsers!: number;

  @Expose({ name: 'tags_by_status' })
  tagsByStatus!: any;

  @Expose({ name: 'recent_scans' })
  recentScans!: number;

  @Expose({ name: 'products_by_category' })
  productsByCategory!: any[];

  @Expose({ name: 'recent_activity' })
  recentActivity!: any[];

  @Expose({ name: 'products_growth' })
  productsGrowth!: number;

  @Expose({ name: 'tags_growth' })
  tagsGrowth!: number;

  @Expose({ name: 'categories_growth' })
  categoriesGrowth!: number;

  @Expose({ name: 'users_growth' })
  usersGrowth!: number;

  constructor(partial: Partial<GenericReportEntity>) {
    Object.assign(this, partial);
  }
}
