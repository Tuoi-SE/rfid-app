import { httpClient } from '@/lib/http/client';
import { TransferType } from '../types';

export interface CreateTransferPayload {
  type: TransferType;
  sourceId: string;
  destinationId: string;
  tagIds: string[];
}

export const createTransfer = (payload: CreateTransferPayload) => {
  return httpClient('/transfers', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};
