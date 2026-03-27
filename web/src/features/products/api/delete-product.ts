import { httpClient } from '@/lib/http/client';

export const deleteProduct = (id: string): Promise<void> => {
  return httpClient(`/products/${id}`, { method: 'DELETE' });
};
