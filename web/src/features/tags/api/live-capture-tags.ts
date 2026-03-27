import { httpClient } from '@/lib/http/client';

export const liveCaptureTags = (data: any[]): Promise<any> => {
  return httpClient('/tags/live', { method: 'POST', body: JSON.stringify(data) });
};
