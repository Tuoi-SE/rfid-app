import { httpClient } from '@/lib/http/client';
import { AuthStorage } from '@/lib/http/auth-storage';

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export const changePassword = async (data: ChangePasswordData, overrideToken?: string): Promise<void> => {
  const token = overrideToken || AuthStorage.getToken();
  await httpClient('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};
