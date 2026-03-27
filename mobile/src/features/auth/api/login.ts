import { httpClient } from '../../../shared/api/http-client';
import { AuthResponse, LoginCredentials } from '../types';

export const loginApi = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  return httpClient<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
};
