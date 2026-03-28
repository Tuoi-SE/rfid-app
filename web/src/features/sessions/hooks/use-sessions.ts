import { useQuery } from '@tanstack/react-query';
import { getSessions } from '../api/get-sessions';
import { getSessionDetail } from '../api/get-session-detail';

export const useSessions = (page = 1, limit = 50) => {
  return useQuery({
    queryKey: ['sessions', page, limit],
    queryFn: () => getSessions({ page, limit }),
    refetchInterval: 3000, // Real-time polling every 3 seconds
  });
};

export const useSessionDetail = (id: string | null) => {
return useQuery({
queryKey: ['sessions', id],
queryFn: () => getSessionDetail(id as string),
enabled: !!id,
});
};
