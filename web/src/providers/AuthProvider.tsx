'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  token: string | null;
  user: { id: string; username: string; role: string } | null;
  login: (accessToken: string, refreshToken: string) => void;
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
    const stored = localStorage.getItem('token');
    if (stored) {
      setToken(stored);
      // Decode JWT to get user info
      try {
        const payload = JSON.parse(atob(stored.split('.')[1]));
        setUser({ id: payload.sub, username: payload.username, role: payload.role });
      } catch {
        localStorage.removeItem('token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (accessToken: string, refreshToken: string) => {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      setUser({ id: payload.sub, username: payload.username, role: payload.role });
    } catch {}
    setToken(accessToken);
    router.push('/');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
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
