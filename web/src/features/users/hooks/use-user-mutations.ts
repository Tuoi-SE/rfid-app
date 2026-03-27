import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createUser } from '../api/create-user';
import { updateUser } from '../api/update-user';
import { deleteUser } from '../api/delete-user';
import { UserFormData } from '../types';

export const useUserMutations = () => {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users'] });

  const createMutation = useMutation({
    mutationFn: (data: UserFormData) => createUser(data),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UserFormData> }) => updateUser(id, data),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: invalidate,
  });

  return { createMutation, updateMutation, deleteMutation };
};
