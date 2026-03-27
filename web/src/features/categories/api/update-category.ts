import { httpClient } from '@/lib/http/client';
import { CategoryFormData, Category } from '../types';

export const updateCategory = (id: string, data: CategoryFormData): Promise<Category> => {
  return httpClient(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
};
