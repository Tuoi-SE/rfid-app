import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProduct } from '../api/create-product';
import { updateProduct } from '../api/update-product';
import { deleteProduct } from '../api/delete-product';
import { ProductFormData } from '../types';
import toast from 'react-hot-toast';

export const useProductMutations = () => {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['products'] });

  const createMutation = useMutation({
    mutationFn: (data: ProductFormData) => createProduct(data),
    onSuccess: () => {
      toast.success('Thêm mới thành công!');
      invalidate();
    },
    onError: (err: any) => toast.error(`Lỗi: ${err.message || 'Thao tác thất bại'}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductFormData> }) => updateProduct(id, data),
    onSuccess: () => {
      toast.success('Cập nhật thành công!');
      invalidate();
    },
    onError: (err: any) => toast.error(`Lỗi: ${err.message || 'Thao tác thất bại'}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      toast.success('Xóa thành công!');
      invalidate();
    },
    onError: (err: any) => toast.error(`Lỗi: ${err.message || 'Thao tác thất bại'}`),
  });

  return { createMutation, updateMutation, deleteMutation };
};
