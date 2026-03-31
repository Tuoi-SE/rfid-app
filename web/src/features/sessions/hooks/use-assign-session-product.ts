import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assignSessionProduct, AssignSessionStrategy } from '../api/assign-session-product';

export const useAssignSessionProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      productId,
      strategy,
    }: {
      sessionId: string;
      productId: string;
      strategy?: AssignSessionStrategy;
    }) => assignSessionProduct(sessionId, { productId, strategy }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};
