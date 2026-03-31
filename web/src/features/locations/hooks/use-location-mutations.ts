import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createLocation } from '../api/create-location';
import { updateLocation } from '../api/update-location';
import { deleteLocation } from '../api/delete-location';
import { LocationFormData, UpdateLocationData } from '../types';
import toast from 'react-hot-toast';

export const useLocationMutations = () => {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['locations'] });

  const createMutation = useMutation({
    mutationFn: (data: LocationFormData) => createLocation(data),
    onSuccess: () => {
      toast.success('Thêm mới thành công!');
      invalidate();
    },
    onError: (err: any) => toast.error(`Lỗi: ${err.message || 'Thao tác thất bại'}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLocationData }) => updateLocation(id, data),
    onSuccess: () => {
      toast.success('Cập nhật thành công!');
      invalidate();
    },
    onError: (err: any) => toast.error(`Lỗi: ${err.message || 'Thao tác thất bại'}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteLocation(id),
    onSuccess: () => {
      toast.success('Xóa thành công!');
      invalidate();
    },
    onError: (err: any) => toast.error(`Lỗi: ${err.message || 'Thao tác thất bại'}`),
  });

  return { createMutation, updateMutation, deleteMutation };
};
