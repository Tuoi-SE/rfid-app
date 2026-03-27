import { useQuery } from '@tanstack/react-query';
import { getActivityLogs } from '../api/get-activity-logs';

export function useActivityLogs(search?: string) {
  return useQuery({
    queryKey: ['activity-logs', search],
    queryFn: () => getActivityLogs(search ? `action=${search}` : ''),
  });
}
