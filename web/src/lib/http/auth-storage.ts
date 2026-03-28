const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const AuthStorage = {
  getToken: () => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
  },
  
  getRefreshToken: () => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(REFRESH_TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  
  setToken: (token: string, refreshToken?: string, remember: boolean = true) => {
    if (typeof window !== 'undefined') {
      const storage = remember ? localStorage : sessionStorage;
      
      // Xóa ở cả 2 nơi trước khi lưu để tránh xung đột
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);

      storage.setItem(TOKEN_KEY, token);
      if (refreshToken) storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },

  removeToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  },
};
