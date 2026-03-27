import { httpClient } from '@/lib/http/client';
import { AuthResponse, LoginCredentials } from '../types';

export const loginAuth = (data: LoginCredentials): Promise<AuthResponse> => {
  return httpClient('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};
