import { httpClient } from '@/lib/http/client';
import { OrderItemForm } from '../types';

export async function createOrder(data: { type: 'INBOUND' | 'OUTBOUND'; items: OrderItemForm[] }) {
  return httpClient('/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
