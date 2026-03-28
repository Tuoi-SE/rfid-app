import { useState, useMemo, useCallback } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T> {
  key: keyof T | string;
  direction: SortDirection;
}

export function useTableSort<T>(items: T[], customSort?: (a: T, b: T, config: SortConfig<T>) => number) {
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(null);

  const handleSort = useCallback((key: keyof T | string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        if (current.direction === 'asc') return { key, direction: 'desc' };
        return null; // Trả về mặc định nếu bấm lần 3
      }
      return { key, direction: 'asc' };
    });
  }, []);

  const sortedItems = useMemo(() => {
    if (!sortConfig) return items;

    const sortableItems = [...items];
    sortableItems.sort((a, b) => {
      // Nếu có hàm custom sort truyền từ ngoài vào
      if (customSort) {
        const result = customSort(a, b, sortConfig);
        if (result !== 0) return result;
      }

      // Logic sort cơ bản
      const aValue = (a as any)[sortConfig.key];
      const bValue = (b as any)[sortConfig.key];

      if (typeof aValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue || '')
          : (bValue || '').localeCompare(aValue);
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sortableItems;
  }, [items, sortConfig, customSort]);

  return {
    sortedItems,
    sortConfig,
    handleSort,
  };
}
