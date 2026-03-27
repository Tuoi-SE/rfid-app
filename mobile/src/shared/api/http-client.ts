import { useAuthStore } from '../../features/auth/store/auth.store';
import { API_URL } from './config';
import { ApiError, NetworkError, UnauthorizedError } from './errors';

type FetchOptions = RequestInit & {
  params?: Record<string, string>;
};

export const httpClient = async <T>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
  const { token, logout } = useAuthStore.getState();
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = new URL(`${API_URL}${endpoint}`);
  
  if (options.params) {
    Object.keys(options.params).forEach(key => url.searchParams.append(key, options.params![key]));
  }

  try {
    const response = await fetch(url.toString(), {
      ...options,
      headers,
    });

    if (response.status === 401) {
      logout();
      throw new UnauthorizedError();
    }

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = await response.text();
      }
      throw new ApiError(
        errorData?.message || errorData || 'Request failed',
        response.status,
        errorData
      );
    }

    // Attempt to parse JSON
    if (response.status === 204) {
      return {} as T;
    }
    return await response.json() as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof TypeError && error.message === 'Network request failed') {
      throw new NetworkError();
    }
    throw error;
  }
};
