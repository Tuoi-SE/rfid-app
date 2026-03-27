import { useQuery } from '@tanstack/react-query';
import { getUsers } from '../api/get-users';

export const useUsers = (search?: string) => {
  return useQuery({
    queryKey: ['users', search],
    queryFn: () => getUsers(search),
  });
};
