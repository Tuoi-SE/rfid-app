import { httpClient } from '@/lib/http/client';

export const assignTags = (data: any): Promise<any> => {
  return httpClient('/tags/assign', { method: 'PATCH', body: JSON.stringify(data) });
};
