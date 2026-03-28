import { httpClient } from '@/lib/http/client';
import { Order } from '../types';

export const getOrder = async (orderId: string): Promise<Order> => {
  const { data } = await httpClient(`/orders/${orderId}`);
  return data;
};
