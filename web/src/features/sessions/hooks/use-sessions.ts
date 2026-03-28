import { useQuery } from '@tanstack/react-query';
import { getSessions } from '../api/get-sessions';
import { getSessionDetail } from '../api/get-session-detail';

export const useSessions = () => {
return useQuery({
queryKey: ['sessions'],
queryFn: getSessions,
});
};

export const useSessionDetail = (id: string | null) => {
return useQuery({
queryKey: ['sessions', id],
queryFn: () => getSessionDetail(id as string),
enabled: !!id,
});
};
