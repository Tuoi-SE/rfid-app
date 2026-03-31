import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCategory } from '../api/create-category';
import { updateCategory } from '../api/update-category';
import { deleteCategory } from '../api/delete-category';
import { CategoryFormData } from '../types';
import toast from 'react-hot-toast';

export const useCategoryMutations = () => {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['categories'] });

  const createMutation = useMutation({
    mutationFn: (data: CategoryFormData) => createCategory(data),
    onSuccess: () => {
      toast.success('Thêm mới thành công!');
      invalidate();
    },
    onError: (err: any) => toast.error(`Lỗi: ${err.message || 'Thao tác thất bại'}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryFormData }) => updateCategory(id, data),
    onSuccess: () => {
      toast.success('Cập nhật thành công!');
      invalidate();
    },
    onError: (err: any) => toast.error(`Lỗi: ${err.message || 'Thao tác thất bại'}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      toast.success('Xóa thành công!');
      invalidate();
    },
    onError: (err: any) => toast.error(`Lỗi: ${err.message || 'Thao tác thất bại'}`),
  });

  return { createMutation, updateMutation, deleteMutation };
};
