export interface ProductBreakdown {
  id: string;
  name: string;
  sku: string;
  category: string;
  total: number;
  inStock: number;
  outOfStock: number;
  inTransit: number;
  missing: number;
}

export interface CategoryBreakdown {
  name: string;
  total: number;
  inStock: number;
  outOfStock: number;
}

export interface StockSummary {
  overview: {
    totalTags: number;
    unassignedTags: number;
    statuses: Record<string, number>;
  };
  productBreakdown: ProductBreakdown[];
  categoryBreakdown: CategoryBreakdown[];
}
