import { httpClient } from '@/lib/http/client';
import { LocationFormData } from '../types';

export const updateLocation = async (id: string, data: Partial<LocationFormData>) => {
  return httpClient(`/locations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};
