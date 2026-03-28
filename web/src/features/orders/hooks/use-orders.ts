import { useQuery } from '@tanstack/react-query';
import { getOrders } from '../api/get-orders';

export const useOrders = (search?: string) => {
return useQuery({
queryKey: ['orders', search],
queryFn: () => getOrders(''), // Add search parameter to API if supported, else passing empty string
});
};
