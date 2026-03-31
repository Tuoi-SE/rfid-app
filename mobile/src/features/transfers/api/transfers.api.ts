import { httpClient } from '../../../shared/api/http-client';
import { TransferData } from '../types';

export const transfersApi = {
  pullTransfers: async (): Promise<TransferData[]> => {
    // Note: D-14 backend nested pagination wrappers might exist, so we defensively extract array.
    const res: any = await httpClient<any>('/transfers', { method: 'GET', params: { limit: '100' } });
    
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

  confirmTransfer: async (id: string, scannedTags: { epc: string }[]) => {
    // Current D-14 backend only tracks ID, but we optionally pass scans for future-proofing or strict validation logic.
    return httpClient(`/transfers/${id}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ scans: scannedTags })
    });
  }
};
