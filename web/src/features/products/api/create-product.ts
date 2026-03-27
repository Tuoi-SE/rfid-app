import { httpClient } from '@/lib/http/client';
import { ProductFormData, Product } from '../types';

export const createProduct = (data: ProductFormData): Promise<Product> => {
  return httpClient('/products', { method: 'POST', body: JSON.stringify(data) });
};
