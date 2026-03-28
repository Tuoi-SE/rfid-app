import { httpClient } from '@/lib/http/client';

export const deleteOrder = async (orderId: string): Promise<void> => {
  await httpClient(`/orders/${orderId}`, {
    method: 'DELETE',
  });
};
