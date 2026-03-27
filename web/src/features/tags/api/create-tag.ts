import { httpClient } from '@/lib/http/client';

export const createTag = (data: any): Promise<any> => {
  return httpClient('/tags', { method: 'POST', body: JSON.stringify(data) });
};
