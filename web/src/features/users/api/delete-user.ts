import { httpClient } from '@/lib/http/client';

export const deleteUser = (id: string): Promise<void> => {
  return httpClient(`/users/${id}`, { method: 'DELETE' });
};
