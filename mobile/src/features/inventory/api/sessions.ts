import { httpClient } from '../../../shared/api/http-client';

export const inventoryApi = {
  pushLiveScan: async (tags: { epc: string; rssi: number }[]) => {
    return httpClient('api/scan/live', {
      method: 'POST',
      body: JSON.stringify({ tags })
    });
  },

  pushSession: async (session: { name: string; scans: { epc: string; rssi: number; time: Date }[] }) => {
    return httpClient('api/scan/session', {
      method: 'POST',
      body: JSON.stringify(session)
    });
  },

  pullTags: async (): Promise<Record<string, string>> => {
    const items = await httpClient<any[]>('api/tags', { method: 'GET' });
    const map: Record<string, string> = {};
    items.forEach(i => { map[i.epc] = i.name; });
    return map;
  },

  getProducts: async () => {
    return httpClient<any[]>('api/products', { method: 'GET' });
  },

  assignTags: async (productId: string, epcs: string[]) => {
    return httpClient(`api/products/${productId}/assign-tags`, {
      method: 'POST',
      body: JSON.stringify({ epcs })
    });
  }
};
