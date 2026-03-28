import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../api/get-categories';

import { Category } from '../types';

export const useCategories = (search?: string) => {
  return useQuery({
    queryKey: ['categories', search],
    queryFn: () => getCategories(search),
    select: (data) => {
      const responseData = (data as Record<string, unknown>)?.data ?? data;
      return (Array.isArray(responseData) 
        ? responseData 
        : ((responseData as Record<string, unknown>)?.items || [])) as Category[];
    }
  });
};
