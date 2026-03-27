import { httpClient } from '@/lib/http/client';
import { Order } from '../types';

export async function getOrders(params?: string) {
  const query = params ? `?${params}` : '';
  return httpClient<{ data: Order[] } | Order[]>(`/orders${query}`);
}
