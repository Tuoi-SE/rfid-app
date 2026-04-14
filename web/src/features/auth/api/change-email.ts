import { httpClient } from '@/lib/http/client';
import { AuthStorage } from '@/lib/http/auth-storage';

export interface RequestChangeEmailData {
  currentPassword: string;
  newEmail: string;
}

export interface ConfirmChangeEmailData {
  oldEmail: string;
  otp: string;
}

export const requestChangeEmail = async (data: RequestChangeEmailData): Promise<void> => {
  const token = AuthStorage.getToken();
  await httpClient('/auth/request-change-email', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};

export const confirmChangeEmail = async (data: ConfirmChangeEmailData): Promise<void> => {
  await httpClient('/auth/confirm-change-email', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};
