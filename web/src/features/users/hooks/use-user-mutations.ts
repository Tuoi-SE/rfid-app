import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createUser } from '../api/create-user';
import { updateUser } from '../api/update-user';
import { deleteUser } from '../api/delete-user';
import { restoreUser } from '../api/restore-user';
import { UserFormData } from '../types';
import toast from 'react-hot-toast';

export const useUserMutations = () => {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users'] });

  const createMutation = useMutation({
    mutationFn: (data: UserFormData) => createUser(data),
    onSuccess: () => {
      toast.success('Thêm mới thành công!');
      invalidate();
    },
    onError: (err: any) => toast.error(`Lỗi: ${err.message || 'Thao tác thất bại'}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UserFormData> }) => updateUser(id, data),
    onSuccess: () => {
      toast.success('Cập nhật thành công!');
      invalidate();
    },
    onError: (err: any) => toast.error(`Lỗi: ${err.message || 'Thao tác thất bại'}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      toast.success('Xóa thành công!');
      invalidate();
    },
    onError: (err: any) => toast.error(`Lỗi: ${err.message || 'Thao tác thất bại'}`),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => restoreUser(id),
    onSuccess: () => {
      toast.success('Khôi phục thành công!');
      invalidate();
    },
    onError: (err: any) => toast.error(`Lỗi: ${err.message || 'Thao tác thất bại'}`),
  });

  return { createMutation, updateMutation, deleteMutation, restoreMutation };
};
