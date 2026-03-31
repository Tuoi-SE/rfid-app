import { httpClient } from '@/lib/http/client';
import { ApiResponse } from '@/types/api';

export type AssignSessionStrategy = 'UNASSIGNED_ONLY' | 'OVERWRITE_ALL';

export interface AssignSessionProductPayload {
  productId: string;
  strategy?: AssignSessionStrategy;
}

export const assignSessionProduct = (
  sessionId: string,
  payload: AssignSessionProductPayload,
): Promise<ApiResponse<{ count: number; strategy?: AssignSessionStrategy; totalInSession?: number; assignedBefore?: number; unassignedBefore?: number }>> => {
  return httpClient(`/sessions/${sessionId}/assign-product`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
};
