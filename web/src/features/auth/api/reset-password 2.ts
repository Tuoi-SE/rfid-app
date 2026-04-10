import { httpClient } from '@/lib/http/client';

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface ResetPasswordData {
  email: string;
  token: string;
  newPassword: string;
}

export const resetPassword = async (data: ResetPasswordData): Promise<void> => {
  await httpClient('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};
