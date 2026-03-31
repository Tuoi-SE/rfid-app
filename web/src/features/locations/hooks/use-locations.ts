import { useQuery } from '@tanstack/react-query';
import { getLocations } from '../api/get-locations';

export const useLocations = (query?: string) => {
  return useQuery({
    queryKey: ['locations', query],
    queryFn: () => getLocations(query),
  });
};
