import { AuthStorage } from './auth-storage';
import { HttpError, UnauthorizedError } from './errors';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const httpClient = async <T = any>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = AuthStorage.getToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    AuthStorage.removeToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new UnauthorizedError();
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new HttpError(response.status, err.message || `API Error: ${response.statusText}`, err);
  }

  return response.json();
};
