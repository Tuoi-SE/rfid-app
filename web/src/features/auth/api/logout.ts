import { httpClient } from '@/lib/http/client';

export const logoutAuth = (refreshToken: string): Promise<void> => {
  return httpClient('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
};
