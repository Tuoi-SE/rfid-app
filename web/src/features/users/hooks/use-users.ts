import { useQuery } from '@tanstack/react-query';
import { getUsers } from '../api/get-users';

interface UseUsersParams {
  search?: string;
  page?: number;
  limit?: number;
}

export const useUsers = (params?: UseUsersParams) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => getUsers(params),
  });
};
