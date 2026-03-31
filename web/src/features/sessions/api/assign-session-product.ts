import { httpClient } from '@/lib/http/client';
import { ApiResponse } from '@/types/api';

export const assignSessionProduct = (sessionId: string, productId: string): Promise<ApiResponse<{ count: number }>> => {
  return httpClient(`/sessions/${sessionId}/assign-product`, {
    method: 'PATCH',
    body: JSON.stringify({ productId }),
  });
};
