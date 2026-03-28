import { useQuery } from '@tanstack/react-query';
import { httpClient } from '@/lib/http/client';

export interface CategoryStatsResponse {
  totalCategories: number;
  activeCategories: number;
  totalProducts: number;
  emptyCategories: number;
  growth: number;
}

export function useCategoriesStats() {
  return useQuery({
    queryKey: ['categories-stats'],
    queryFn: async (): Promise<CategoryStatsResponse> => {
      const response = await httpClient('/categories/stats');
      return (response as any).data || response;
    },
    staleTime: 5 * 60 * 1000, // Cache 5 phút
  });
}
