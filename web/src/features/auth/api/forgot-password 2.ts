import { httpClient } from '@/lib/http/client';

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export const forgotPassword = async (email: string): Promise<void> => {
  await httpClient('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};
