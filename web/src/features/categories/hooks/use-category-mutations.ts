import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCategory } from '../api/create-category';
import { updateCategory } from '../api/update-category';
import { deleteCategory } from '../api/delete-category';
import { CategoryFormData } from '../types';

export const useCategoryMutations = () => {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['categories'] });

  const createMutation = useMutation({
    mutationFn: (data: CategoryFormData) => createCategory(data),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryFormData }) => updateCategory(id, data),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: invalidate,
  });

  return { createMutation, updateMutation, deleteMutation };
};
