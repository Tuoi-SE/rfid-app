import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../api/get-products';

export const useProducts = (paramsString: string) => {
  return useQuery({
    queryKey: ['products', paramsString],
    queryFn: () => getProducts(paramsString),
    placeholderData: (previousData) => previousData,
  });
};
