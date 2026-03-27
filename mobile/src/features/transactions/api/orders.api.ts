import { httpClient } from '../../../shared/api/http-client';
import { Order } from '../types';

export const ordersApi = {
  pullOrders: async (): Promise<Order[]> => {
    return httpClient<Order[]>('api/orders', { method: 'GET' });
  },

  pushSession: async (session: { name: string; orderId: string; scans: { epc: string; rssi: number; time: Date }[] }) => {
    return httpClient('api/scan/session', {
      method: 'POST',
      body: JSON.stringify(session)
    });
  }
};
