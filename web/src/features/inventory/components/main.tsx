'use client';

import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { TableActions } from '@/components/TableActions';
import { InventoryStatCards, InventoryStat } from './inventory-stat-cards';
import { InventoryCategoryAnalysis, CategoryStat } from './inventory-category-analysis';
import { InventoryTable, InventoryProductStat } from './inventory-table';
import { Loader2, PackageCheck, ArrowUpRight, Truck, AlertCircle, HelpCircle, Box, Package } from 'lucide-react';
import { useStockSummary } from '../hooks/use-inventory';

// Helpers to assign random icons/themes to dynamic categories for UI flair
const CATEGORY_THEMES: ('blue' | 'indigo' | 'green')[] = ['blue', 'indigo', 'green'];
const CATEGORY_ICONS = [Box, Package, PackageCheck];

export const InventoryMain = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data, isLoading, error } = useStockSummary();

  const payload = (data as any)?.data || data;
  const overview = payload?.overview;
  const rawCategories = payload?.categoryBreakdown ?? [];

  const filteredProducts = useMemo(() => {
    const rawProducts = payload?.productBreakdown ?? [];
    const productStats: InventoryProductStat[] = rawProducts.map((p: any) => {
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

    if (!searchQuery.trim()) return productStats;
    const lowerQuery = searchQuery.toLowerCase();
    return productStats.filter(p => 
      p.name?.toLowerCase().includes(lowerQuery) || 
      p.sku?.toLowerCase().includes(lowerQuery) ||
      p.category?.toLowerCase().includes(lowerQuery)
    );
  }, [payload?.productBreakdown, searchQuery]);

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
  const inventoryStats: InventoryStat[] = [
    {
      id: '1',
      label: 'Trong xưởng',
      value: (overview?.statuses?.IN_WORKSHOP ?? 0).toLocaleString(),
      colorScheme: 'indigo',
      icon: Box,
    },
    {
      id: '2',
      label: 'Trong kho',
      value: (overview?.statuses?.IN_WAREHOUSE ?? 0).toLocaleString(),
      colorScheme: 'green',
      icon: PackageCheck,
      trend: '+2%', // Mocked UI decorator
      trendUp: true
    },
    {
      id: '3',
      label: 'Đã xuất',
      value: (overview?.statuses?.COMPLETED ?? 0).toLocaleString(),
      colorScheme: 'slate',
      icon: ArrowUpRight
    },
    {
      id: '4',
      label: 'Mất tích',
      value: (overview?.statuses?.MISSING ?? 0).toLocaleString(),
      colorScheme: 'red',
      icon: AlertCircle,
      alertText: (overview?.statuses?.MISSING ?? 0) > 0 ? 'CẢNH BÁO' : undefined
    },
    {
      id: '5',
      label: 'Chưa gắn SP',
      value: ((overview?.statuses?.UNASSIGNED ?? 0) + (overview?.unassignedTags ?? 0)).toLocaleString(),
      colorScheme: 'gray',
      icon: HelpCircle
    },
  ];

  // 2. Map Category Analysis (limitting to top 3 for UI consistency or showing all)
  const categoryStats: CategoryStat[] = rawCategories.slice(0, 3).map((cat: any, index: number) => {
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

  return (
    <div className="space-y-4 xl:space-y-6 pb-8">
      <PageHeader
        title="Tồn kho Hệ thống"
        description="Phân tích tồn kho theo sản phẩm và danh mục thời gian thực."
      />

      {/* Main Stats */}
      <InventoryStatCards stats={inventoryStats} />

      {/* Analytics Section */}
      {categoryStats.length > 0 && (
        <InventoryCategoryAnalysis categories={categoryStats} />
      )}

      {/* Table Actions Toolbar (Global UI Style) */}
      <TableActions 
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Tìm kiếm SKU, sản phẩm, danh mục..."
        onExport={() => alert('Chức năng xuất Excel đang được xây dựng...')}
        onFilter={() => alert('Mở thanh lọc nâng cao...')}
      />

      {/* Detailed Data Table */}
      <InventoryTable data={filteredProducts} />
    </div>
  );
};
