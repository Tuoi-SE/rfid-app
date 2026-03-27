import { httpClient } from '@/lib/http/client';

export const getTagHistory = (epc: string): Promise<any> => {
  return httpClient(`/tags/${epc}/history`);
};
