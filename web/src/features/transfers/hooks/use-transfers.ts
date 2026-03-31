import { useQuery } from '@tanstack/react-query';
import { getTransfers } from '../api/get-transfers';

export const useTransfers = (query?: string) => {
  return useQuery({
    queryKey: ['transfers', query],
    queryFn: () => getTransfers(query),
  });
};
