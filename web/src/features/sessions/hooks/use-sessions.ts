import { useQuery } from '@tanstack/react-query';
import { getSessions } from '../api/get-sessions';
import { getSessionDetail } from '../api/get-session-detail';

export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: getSessions,
  });
}

export function useSessionDetail(id: string | null) {
  return useQuery({
    queryKey: ['sessions', id],
    queryFn: () => getSessionDetail(id as string),
    enabled: !!id,
  });
}
