import { httpClient } from '@/lib/http/client';

export const deleteLocation = async (id: string) => {
  return httpClient(`/locations/${id}`, {
    method: 'DELETE',
  });
};
