import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteTag } from '../api/delete-tag';
import { createTag } from '../api/create-tag';
import { updateTag } from '../api/update-tag';
import { assignTags } from '../api/assign-tags';
import { liveCaptureTags } from '../api/live-capture-tags';

export const useTagMutations = () => {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['tags'] });

  const deleteMutation = useMutation({
    mutationFn: (epc: string) => deleteTag(epc),
    onSuccess: invalidate,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => createTag(data),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ epc, data }: { epc: string, data: any }) => updateTag(epc, data),
    onSuccess: invalidate,
  });

  const assignMutation = useMutation({
    mutationFn: (data: { productId: string, tagIds: string[] }) => assignTags(data),
    onSuccess: invalidate,
  });

  const liveCaptureMutation = useMutation({
    mutationFn: (data: any[]) => liveCaptureTags(data),
    onSuccess: invalidate,
  });

  return { deleteMutation, createMutation, updateMutation, assignMutation, liveCaptureMutation };
};
