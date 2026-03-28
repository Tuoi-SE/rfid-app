import { httpClient } from '@/lib/http/client';
import { SessionData } from '../types';

export interface GetSessionsParams {
  page?: number;
  limit?: number;
}

export const getSessions = async (params?: GetSessionsParams) => {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return httpClient(`/sessions${queryString}`);
};
