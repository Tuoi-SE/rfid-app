import { httpClient } from '@/lib/http/client';
import { ProductFormData, Product } from '../types';

export const updateProduct = (id: string, data: Partial<ProductFormData>): Promise<Product> => {
  return httpClient(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
};
