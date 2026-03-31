'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { TableActions } from '@/components/TableActions';
import { InventoryStatCards, InventoryStat } from './inventory-stat-cards';
import { InventoryCategoryAnalysis, CategoryStat } from './inventory-category-analysis';
import { InventoryTable, InventoryProductStat } from './inventory-table';
import { InventoryLocationTable } from './inventory-location-table';
import { Loader2, PackageCheck, ArrowUpRight, AlertCircle, HelpCircle, Box, Package } from 'lucide-react';
import { useStockSummary } from '../hooks/use-inventory';
import type { StockSummary } from '../types';

// Helpers to assign random icons/themes to dynamic categories for UI flair
const CATEGORY_THEMES: ('blue' | 'indigo' | 'green')[] = ['blue', 'indigo', 'green'];
const CATEGORY_ICONS = [Box, Package, PackageCheck];

export const InventoryMain = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const { data, isLoading, error } = useStockSummary();

  const response = data as { data?: StockSummary } | StockSummary | undefined;
  let payload: Partial<StockSummary> = {};
  if (response && typeof response === 'object') {
    if ('overview' in response || 'productBreakdown' in response || 'categoryBreakdown' in response) {
      payload = response as StockSummary;
    } else if ('data' in response && response.data) {
      payload = response.data;
    }
  }
  const overview = payload?.overview;
  const rawCategories = payload?.categoryBreakdown ?? [];
  const locationBreakdown = payload?.locationBreakdown ?? [];

  const rawProducts = payload?.productBreakdown ?? [];
  const productStats: InventoryProductStat[] = rawProducts.map((p) => {
    const total = p.total || 0;
    const inStock = p.inStock || 0;
    const pct = total === 0 ? 0 : Math.round((inStock / total) * 100);

    return {
      id: p.id || p.sku,
      name: p.name,
      sku: p.sku,
      category: p.category,
      total: total,
      inStock: inStock,
      exported: p.outOfStock || 0,
      inTransit: p.inTransit || 0,
      missing: p.missing || 0,
      stockRate: pct,
    };
  });

  const uniqueCategories = React.useMemo(() => {
    const cats = productStats.map(p => p.category).filter(Boolean) as string[];
    return Array.from(new Set(cats)).map(c => ({ label: c, value: c }));
  }, [productStats]);

  const filteredProducts = React.useMemo(() => {
    let result = productStats;
    if (filterCategory) result = result.filter(p => p.category === filterCategory);

    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter((p) =>
        p.name?.toLowerCase().includes(lowerQuery) ||
        p.sku?.toLowerCase().includes(lowerQuery) ||
        p.category?.toLowerCase().includes(lowerQuery),
      );
    }
    return result;
  }, [productStats, searchQuery, filterCategory]);

  const exportExcel = () => {
    const exportData = filteredProducts.map(p => ({
      'SKU': p.sku,
      'Sản Phẩm': p.name,
      'Danh Mục': p.category,
      'Tổng Số (Thẻ)': p.total,
      'Đang Lưu Kho': p.inStock,
      'Thất Lạc': p.missing,
      'Di Chuyển': p.inTransit,
      'Đã Xuất': p.exported,
      'Tỷ Lệ Tồn (%)': p.stockRate
    }));
    import('@/utils/export-excel').then(mod => {
      mod.exportToExcel(exportData, 'Phan_Tich_Ton_Kho');
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[#04147B] mb-4" />
        <p className="text-slate-500 font-medium">Đang tải dữ liệu tồn kho...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-red-500 text-center p-8 bg-white rounded-xl shadow-sm border border-red-100">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <h2 className="font-bold text-lg mb-2">Lỗi tải dữ liệu</h2>
        <p>Không thể kết nối với hệ thống. Vui lòng thử lại sau.</p>
      </div>
    );
  }

  // 1. Map Stats from API context
  const flow = overview?.flow;
  const locationTypeCounts = overview?.locationTypeCounts || {};

  const adminInStock =
    typeof flow?.adminInStock === 'number'
      ? flow.adminInStock
      : (locationTypeCounts.ADMIN ?? 0);
  const workshopInStock =
    typeof flow?.workshopInStock === 'number'
      ? flow.workshopInStock
      : (locationTypeCounts.WORKSHOP ?? 0);
  const workshopWarehouseInStock =
    typeof flow?.workshopWarehouseInStock === 'number'
      ? flow.workshopWarehouseInStock
      : (locationTypeCounts.WORKSHOP_WAREHOUSE ?? 0);
  const warehouseInStock =
    typeof flow?.warehouseInStock === 'number'
      ? flow.warehouseInStock
      : (locationTypeCounts.WAREHOUSE ?? 0);
  const allInStockAtAdmin =
    typeof flow?.allInStockAtAdmin === 'boolean'
      ? flow.allInStockAtAdmin
      : (adminInStock > 0 && workshopInStock === 0 && workshopWarehouseInStock === 0 && warehouseInStock === 0);

  const inventoryStats: InventoryStat[] = [
    {
      id: '1',
      label: 'Trong xưởng',
      value: workshopInStock.toLocaleString(),
      colorScheme: 'indigo',
      icon: Box,
    },
    {
      id: '2',
      label: 'Kho xưởng',
      value: workshopWarehouseInStock.toLocaleString(),
      colorScheme: 'green',
      icon: Package,
    },
    {
      id: '3',
      label: 'Kho trung tâm',
      value: warehouseInStock.toLocaleString(),
      colorScheme: 'green',
      icon: PackageCheck,
      trend: '+2%',
      trendUp: true
    },
    {
      id: '4',
      label: 'Đã xuất',
      value: (overview?.statuses?.COMPLETED ?? 0).toLocaleString(),
      colorScheme: 'slate',
      icon: ArrowUpRight
    },
    {
      id: '5',
      label: 'Mất tích',
      value: (overview?.statuses?.MISSING ?? 0).toLocaleString(),
      colorScheme: 'red',
      icon: AlertCircle,
      alertText: (overview?.statuses?.MISSING ?? 0) > 0 ? 'CẢNH BÁO' : undefined
    },
    {
      id: '6',
      label: 'Chưa gắn SP',
      value: ((overview?.statuses?.UNASSIGNED ?? 0) + (overview?.unassignedTags ?? 0)).toLocaleString(),
      colorScheme: 'gray',
      icon: HelpCircle
    },
  ];

  if (allInStockAtAdmin) {
    inventoryStats.splice(2, 0, {
      id: 'admin-stock',
      label: 'Kho Admin',
      value: adminInStock.toLocaleString(),
      colorScheme: 'indigo',
      icon: Package,
    });
  }

  // 2. Map all Category Analysis
  const allCategoryStats: CategoryStat[] = rawCategories.map((cat, index: number) => {
    const total = cat.total || 0;
    const inStock = cat.inStock || 0;
    const pct = total === 0 ? 0 : Math.round((inStock / total) * 100);
    return {
      id: cat.name,
      name: cat.name,
      totalProducts: total,
      inStockPercent: pct,
      inStockUnits: `${inStock.toLocaleString()} ĐƠN VỊ`,
      colorTheme: CATEGORY_THEMES[index % CATEGORY_THEMES.length],
      icon: CATEGORY_ICONS[index % CATEGORY_ICONS.length],
    };
  });

  const visibleCategories = showAllCategories ? allCategoryStats : allCategoryStats.slice(0, 3);
  const hasMoreCategories = allCategoryStats.length > 3;

  return (
    <div className="space-y-4 xl:space-y-6 pb-8">
      <PageHeader
        title="Tồn kho Hệ thống"
        description="Phân tích tồn kho theo sản phẩm và danh mục thời gian thực."
      />

      {/* Main Stats */}
      <InventoryStatCards stats={inventoryStats} />

      {/* Location Drill-down */}
      <InventoryLocationTable data={locationBreakdown} />

      {/* Analytics Section */}
      {visibleCategories.length > 0 && (
        <InventoryCategoryAnalysis 
          categories={visibleCategories}
          onViewAll={hasMoreCategories ? () => setShowAllCategories(prev => !prev) : undefined}
          showAllLabel={showAllCategories ? 'Thu gọn' : `Xem tất cả (${allCategoryStats.length})`}
        />
      )}

      {/* Table Actions Toolbar (Global UI Style) */}
      <TableActions 
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Tìm kiếm SKU, sản phẩm, danh mục..."
        showExport={true}
        onExport={exportExcel}
        filters={[
          {
            key: 'category',
            label: 'Tất cả danh mục',
            value: filterCategory,
            onChange: setFilterCategory,
            options: uniqueCategories
          }
        ]}
        statusText={`Đang hiển thị ${filteredProducts.length} sản phẩm`}
      />

      {/* Detailed Data Table */}
      <InventoryTable data={filteredProducts} />
    </div>
  );
};
