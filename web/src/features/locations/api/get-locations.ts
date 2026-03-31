import { httpClient } from '@/lib/http/client';

export const getLocations = (query?: string) => {
  return httpClient(`/locations${query ? `?${query}` : ''}`);
};
