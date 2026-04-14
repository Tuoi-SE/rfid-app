import { httpClient } from "../../../shared/api/http-client";

export const inventoryApi = {
  pushLiveScan: async (tags: { epc: string; rssi: number }[]) => {
    return httpClient("/tags/live", {
      method: "POST",
      body: JSON.stringify({ tags }),
    });
  },

  pushSession: async (session: {
    name: string;
    scans: { epc: string; rssi: number; time: Date }[];
  }) => {
    return httpClient("/sessions", {
      method: "POST",
      body: JSON.stringify(session),
    });
  },

  pullTags: async (): Promise<Record<string, string>> => {
    const res: any = await httpClient<any>('/tags', { method: 'GET', params: { limit: '1000' } });
    
    // NestJS response: { success, data: { items: [...], pagination } }
    // httpClient returns the full JSON body
    let items: any[] = [];
    
    if (res?.data?.items && Array.isArray(res.data.items)) {
      items = res.data.items;
    } else if (res?.data && Array.isArray(res.data)) {
      items = res.data;
    } else if (Array.isArray(res)) {
      items = res;
    }

    console.log('[pullTags] Extracted', items.length, 'tags from server');

    const map: Record<string, string> = {};
    items.forEach(i => { map[i.epc || i.tagEpc] = i?.product?.name || i.name || i.epc; });
    return map;
  },

  getProducts: async () => {
    const res: any = await httpClient<any>('/products', { method: 'GET', params: { limit: '1000' } });
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

};
