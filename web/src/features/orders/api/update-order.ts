import { httpClient } from '@/lib/http/client';
import { OrderItemForm } from '../types';

interface UpdateOrderPayload {
  type?: 'INBOUND' | 'OUTBOUND';
  items?: OrderItemForm[];
}

export const updateOrder = async (orderId: string, payload: UpdateOrderPayload): Promise<void> => {
  await httpClient(`/orders/${orderId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
};
