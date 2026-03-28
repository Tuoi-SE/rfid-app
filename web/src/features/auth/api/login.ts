import { httpClient } from '@/lib/http/client';
import { AuthResponse, LoginCredentials } from '../types';

export const loginAuth = async (data: LoginCredentials): Promise<AuthResponse> => {
  const res = await httpClient<any>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  // NestJS có Global Interceptor bọc response trong { success: true, data: {...} }
  return res.data ? res.data : res;
};
