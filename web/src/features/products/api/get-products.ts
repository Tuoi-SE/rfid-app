import { httpClient } from '@/lib/http/client';
import { Product } from '../types';
import { ApiResponse } from '@/types/api';

export const getProducts = (params?: string): Promise<ApiResponse<Product[]> | Product[] | any> => {
  return httpClient(`/products${params ? `?${params}` : ''}`);
};
