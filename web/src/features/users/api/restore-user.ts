import { httpClient } from '@/lib/http/client';

export const restoreUser = (id: string): Promise<any> => {
  return httpClient(`/users/${id}/restore`, {
    method: 'POST',
  });
};
