import { httpClient } from '@/lib/http/client';

export const updateTag = (epc: string, data: any): Promise<any> => {
  return httpClient(`/tags/${epc}`, { method: 'PATCH', body: JSON.stringify(data) });
};
