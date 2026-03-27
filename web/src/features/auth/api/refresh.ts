import { httpClient } from '@/lib/http/client';
import { AuthResponse } from '../types';

export const refreshAuth = (refreshToken: string): Promise<AuthResponse> => {
  return httpClient('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
};
