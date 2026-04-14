import { httpClient } from '@/lib/http/client';

export interface UpdateProfileData {
  fullName: string;
  phone?: string;
}

export const updateProfile = async (data: UpdateProfileData): Promise<{ access_token: string, refresh_token: string }> => {
  return await httpClient('/auth/update-profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};
