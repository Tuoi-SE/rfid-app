import { AuthStorage } from './auth-storage';
import { HttpError, UnauthorizedError } from './errors';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

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
    const refreshToken = AuthStorage.getRefreshToken();
    
    // Nếu không có refresh token -> force logout ngay lập tức
    if (!refreshToken) {
      AuthStorage.removeToken();
      if (typeof window !== 'undefined') window.location.href = '/login';
      throw new UnauthorizedError();
    }

    if (!isRefreshing) {
      isRefreshing = true;

      try {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!refreshRes.ok) {
          throw new Error('Refresh Token Failed');
        }

        const resData = await refreshRes.json();
        const newTokens = resData.data;
        
        // Kiểm tra xem user đang dùng localStorage hay sessionStorage để lưu đúng chỗ
        const isLocalStorage = typeof window !== 'undefined' && !!localStorage.getItem('token');
        AuthStorage.setToken(newTokens.access_token, newTokens.refresh_token, isLocalStorage);

        isRefreshing = false;
        onRefreshed(newTokens.access_token);

        // Phát request cũ lại với token mới
        headers.set('Authorization', `Bearer ${newTokens.access_token}`);
        const retryResponse = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
        if (!retryResponse.ok) {
           const err = await retryResponse.json().catch(() => ({}));
           throw new HttpError(retryResponse.status, err.message || `API Error: ${retryResponse.statusText}`, err);
        }
        return retryResponse.json();

      } catch (error) {
        // Tình huống xấu: API Refresh hỏng hoặc sai token báo lỗi
        isRefreshing = false;
        refreshSubscribers = [];
        AuthStorage.removeToken();
        if (typeof window !== 'undefined') window.location.href = '/login';
        throw new UnauthorizedError();
      }
    } else {
      // Nếu API refresh đang được gọi bởi request nào đó, các request khác sẽ vào hàng đợi (Queue)
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((newToken) => {
          headers.set('Authorization', `Bearer ${newToken}`);
          fetch(`${API_URL}${endpoint}`, { ...options, headers })
            .then(async (res) => {
              if (res.ok) resolve(res.json());
              else {
                const err = await res.json().catch(() => ({}));
                reject(new HttpError(res.status, err.message || `API Error: ${res.statusText}`, err));
              }
            })
            .catch(reject);
        });
      });
    }
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new HttpError(response.status, err.message || `API Error: ${response.statusText}`, err);
  }

  return response.json();
};
