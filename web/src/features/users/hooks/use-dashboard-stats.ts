import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../api/get-dashboard-stats';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['users', 'dashboard-stats'],
    queryFn: () => getDashboardStats(),
    refetchInterval: 15000, // Refetch every 15 seconds
  });
};
