import { httpClient } from '@/lib/http/client';
import { LocationFormData } from '../types';

export const createLocation = async (data: LocationFormData) => {
  return httpClient('/locations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};
