export interface DashboardSummaryResponse {
  total_products: number;
  total_tags: number;
  total_categories: number;
  total_users: number;
  tags_by_status: Record<string, number>;
  recent_scans: number;
  products_by_category: any[];
  recent_activity: any[];
  products_growth: number;
  tags_growth: number;
  categories_growth: number;
  users_growth: number;
}
