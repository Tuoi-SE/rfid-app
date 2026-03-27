import { httpClient } from '@/lib/http/client';

export const deleteTag = (epc: string): Promise<void> => {
  return httpClient(`/tags/${epc}`, { method: 'DELETE' });
};
