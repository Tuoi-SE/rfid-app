import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../api/get-categories';

export const useCategories = (search?: string) => {
  return useQuery({
    queryKey: ['categories', search],
    queryFn: () => getCategories(search),
  });
};
