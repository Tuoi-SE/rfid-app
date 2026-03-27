import { httpClient } from '@/lib/http/client';
import { UserFormData, User } from '../types';

export const createUser = (data: UserFormData): Promise<User> => {
  return httpClient('/users', { method: 'POST', body: JSON.stringify(data) });
};
