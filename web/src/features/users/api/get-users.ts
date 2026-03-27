import { httpClient } from '@/lib/http/client';
import { User } from '../types';

export const getUsers = (search?: string): Promise<{ data: User[] } | User[] | any> => {
  return httpClient(`/users${search ? `?search=${search}` : ''}`);
};
