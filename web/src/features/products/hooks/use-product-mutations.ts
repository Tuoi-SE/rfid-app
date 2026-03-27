import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProduct } from '../api/create-product';
import { updateProduct } from '../api/update-product';
import { deleteProduct } from '../api/delete-product';
import { ProductFormData } from '../types';

export const useProductMutations = () => {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['products'] });

  const createMutation = useMutation({
    mutationFn: (data: ProductFormData) => createProduct(data),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductFormData> }) => updateProduct(id, data),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: invalidate,
  });

  return { createMutation, updateMutation, deleteMutation };
};
