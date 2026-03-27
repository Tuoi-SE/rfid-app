import { useQuery } from '@tanstack/react-query';
import { getTags } from '../api/get-tags';
import { getTagHistory } from '../api/get-tag-history';

export const useTags = (query: string = '') => {
  return useQuery({
    queryKey: ['tags', query],
    queryFn: () => getTags(query),
  });
};

export const useTagHistory = (epc: string) => {
  return useQuery({
    queryKey: ['tag-history', epc],
    queryFn: () => getTagHistory(epc),
    enabled: !!epc,
  });
};
