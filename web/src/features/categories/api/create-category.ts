import { httpClient } from '@/lib/http/client';
import { CategoryFormData, Category } from '../types';

export const createCategory = (data: CategoryFormData): Promise<Category> => {
  return httpClient('/categories', { method: 'POST', body: JSON.stringify(data) });
};
