import { useMutation, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '@/lib/http/client';
import toast from 'react-hot-toast';

export const useBulkDeleteSessionsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => {
      return httpClient('/sessions/bulk', {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
      });
    },
    onSuccess: (data: any) => {
      toast.success(`Đã xóa ${data?.count || 'các'} phiên quét thành công.`);
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể xóa các phiên quét.');
    },
  });
};
