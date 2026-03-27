import { httpClient } from '@/lib/http/client';
import { UserFormData, User } from '../types';

export const updateUser = (id: string, data: Partial<UserFormData>): Promise<User> => {
  return httpClient(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
};
