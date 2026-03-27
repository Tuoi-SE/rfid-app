import { httpClient } from '@/lib/http/client';
import { TagData } from '../types';

export const getTags = (query: string = ''): Promise<{ data: TagData[] } | TagData[] | any> => {
  return httpClient(`/tags${query ? `?${query}` : ''}`);
};
