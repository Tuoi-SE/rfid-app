import { useQuery } from '@tanstack/react-query';
import { getActivityLogs } from '../api/get-activity-logs';

export const useActivityLogs = (page = 1, limit = 25, search?: string) => {
  return useQuery({
    queryKey: ['activity-logs', page, limit, search],
    queryFn: () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      return getActivityLogs(params.toString());
    },
    refetchInterval: 3000, 
  });
};
