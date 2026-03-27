import { httpClient } from '@/lib/http/client';

export const deleteCategory = (id: string): Promise<void> => {
  return httpClient(`/categories/${id}`, { method: 'DELETE' });
};
