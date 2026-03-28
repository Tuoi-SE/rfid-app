import { httpClient } from '@/lib/http/client';
import { Order } from '../types';

export const getOrders = async (params?: string) => {
const query = params ? `?${params}` : '';
return httpClient<{ data: Order[] } | Order[]>(`/orders${query}`);
};
