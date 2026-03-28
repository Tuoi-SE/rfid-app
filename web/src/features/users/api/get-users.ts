import { httpClient } from '@/lib/http/client';
import { User } from '../types';

interface GetUsersParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface PaginatedUsersResponse {
  data: {
    items: User[];
    pagination: PaginationMeta;
  };
}

export const getUsers = (params?: GetUsersParams): Promise<PaginatedUsersResponse | User[] | Record<string, unknown>> => {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return httpClient(`/users${queryString}`);
};
