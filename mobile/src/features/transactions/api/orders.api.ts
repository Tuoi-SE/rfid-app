import { httpClient } from '../../../shared/api/http-client';
import { Order } from '../types';

export const ordersApi = {
  pullOrders: async (): Promise<Order[]> => {
    const res: any = await httpClient<any>('/orders', { method: 'GET', params: { limit: '100' } });
    
    let items: any[] = [];
    if (res?.data?.items && Array.isArray(res.data.items)) {
      items = res.data.items;
    } else if (res?.data && Array.isArray(res.data)) {
      items = res.data;
    } else if (res?.data?.data && Array.isArray(res.data.data)) {
      items = res.data.data;
    } else if (Array.isArray(res)) {
      items = res;
    }
    
    return items;
  },

  pushSession: async (session: { name: string; orderId: string; scans: { epc: string; rssi: number; time: Date }[] }) => {
    return httpClient('/sessions', {
      method: 'POST',
      body: JSON.stringify(session)
    });
  }
};
