import { httpClient } from '@/lib/http/client';
import { AuthResponse } from '../types';

export const refreshAuth = async (refreshToken: string): Promise<AuthResponse> => {
  const res = await httpClient<any>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  return res.data ? res.data : res;
};
