import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assignSessionProduct } from '../api/assign-session-product';

export const useAssignSessionProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, productId }: { sessionId: string; productId: string }) => 
      assignSessionProduct(sessionId, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};
