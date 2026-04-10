import { httpClient } from '@/lib/http/client';
import { AuthResponse, LoginCredentials } from '../types';

export const loginAuth = async (data: LoginCredentials): Promise<AuthResponse> => {
  const res = await httpClient<AuthResponse | { data: AuthResponse }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  // NestJS has Global Interceptor wrapping response in { success: true, data: {...} }
  return 'data' in res ? res.data : res;
};
