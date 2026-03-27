import { httpClient } from '@/lib/http/client';
import { Category } from '../types';

export const getCategories = (search?: string): Promise<{ data: Category[] } | Category[]> => {
  return httpClient(`/categories${search ? `?search=${search}` : ''}`);
};
