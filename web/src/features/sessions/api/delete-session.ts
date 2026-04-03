import { useMutation, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '@/lib/http/client';
import toast from 'react-hot-toast';

export const useDeleteSessionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      return httpClient(`/sessions/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast.success('Đã xóa phiên quét thành công.');
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể xóa phiên quét.');
    },
  });
};
