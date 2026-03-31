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

export interface LocationBreakdownProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  count: number;
}

export interface LocationBreakdown {
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
  remainingProductKinds?: number;
  topProducts: LocationBreakdownProduct[];
}

export interface StockSummary {
  overview: {
    totalTags: number;
    unassignedTags: number;
    statuses: Record<string, number>;
    locationTypeCounts?: Record<string, number>;
    flow?: {
      adminInStock: number;
      workshopInStock: number;
      workshopWarehouseInStock: number;
      warehouseInStock: number;
      allInStockAtAdmin: boolean;
    };
  };
  productBreakdown: ProductBreakdown[];
  categoryBreakdown: CategoryBreakdown[];
  locationBreakdown?: LocationBreakdown[];
}
