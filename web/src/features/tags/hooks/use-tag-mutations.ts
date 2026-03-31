import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteTag } from '../api/delete-tag';
import { createTag } from '../api/create-tag';
import { updateTag } from '../api/update-tag';
import { assignTags } from '../api/assign-tags';
import { liveCaptureTags } from '../api/live-capture-tags';
import toast from 'react-hot-toast';

export const useTagMutations = () => {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['tags'] });

  const deleteMutation = useMutation({
    mutationFn: (epc: string) => deleteTag(epc),
    onSuccess: () => {
      toast.success('Xóa thành công!');
      invalidate();
    },
    onError: (err: any) => toast.error(`Lỗi: ${err.message || 'Thao tác thất bại'}`),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => createTag(data),
    onSuccess: () => {
      toast.success('Thêm mới thành công!');
      invalidate();
    },
    onError: (err: any) => toast.error(`Lỗi: ${err.message || 'Thao tác thất bại'}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ epc, data }: { epc: string, data: any }) => updateTag(epc, data),
    onSuccess: () => {
      toast.success('Cập nhật thành công!');
      invalidate();
    },
    onError: (err: any) => toast.error(`Lỗi: ${err.message || 'Thao tác thất bại'}`),
  });

  const assignMutation = useMutation({
    mutationFn: (data: { productId: string, tagIds: string[] }) => assignTags(data),
    onSuccess: () => {
      toast.success('Gán thành công!');
      invalidate();
    },
    onError: (err: any) => toast.error(`Lỗi: ${err.message || 'Thao tác thất bại'}`),
  });

  const liveCaptureMutation = useMutation({
    mutationFn: (data: any[]) => liveCaptureTags(data),
    onSuccess: () => {
      toast.success('Quét trực tiếp thành công!');
      invalidate();
    },
    onError: (err: any) => toast.error(`Lỗi: ${err.message || 'Thao tác thất bại'}`),
  });

  return { deleteMutation, createMutation, updateMutation, assignMutation, liveCaptureMutation };
};
