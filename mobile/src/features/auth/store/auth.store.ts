import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  token: string | null;
  username: string | null;
  role: string | null;
  login: (token: string, username: string, role: string) => void;
  logout: () => void;
}

  export const useAuthStore = create<AuthState>()(
    persist(
      (set) => ({
        token: null,
        username: null,
        role: null,
        login: (token, username, role) => {
          set({ token, username, role });
        },
        logout: () => {
          set({ token: null, username: null, role: null });
        },
      }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
