import { httpClient } from '@/lib/http/client';
import { OrderItemForm } from '../types';

export const createOrder = async (data: {
  type: 'INBOUND' | 'OUTBOUND';
  items: OrderItemForm[];
  locationId?: string;
}) => {
    return httpClient('/orders', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};
