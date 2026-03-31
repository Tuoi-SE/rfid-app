import { httpClient } from '@/lib/http/client';
import { UpdateLocationData } from '../types';

export const updateLocation = async (id: string, data: UpdateLocationData) => {
  return httpClient(`/locations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};
