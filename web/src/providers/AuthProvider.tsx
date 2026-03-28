'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AuthStorage } from '@/lib/http/auth-storage';

interface AuthContextType {
  token: string | null;
  user: { id: string; username: string; role: string } | null;
  login: (accessToken: string, refreshToken: string, remember?: boolean) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = AuthStorage.getToken();
    if (stored) {
      setToken(stored);
      // Decode JWT to get user info
      try {
        const payload = JSON.parse(atob(stored.split('.')[1]));
        setUser({ id: payload.sub, username: payload.username, role: payload.role });
      } catch {
        AuthStorage.removeToken();
      }
    }
    setIsLoading(false);
  }, []);

  const login = (accessToken: string, refreshToken: string, remember: boolean = true) => {
    AuthStorage.setToken(accessToken, refreshToken, remember);
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      setUser({ id: payload.sub, username: payload.username, role: payload.role });
    } catch {}
    setToken(accessToken);
    router.push('/');
  };

  const logout = () => {
    AuthStorage.removeToken();
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
