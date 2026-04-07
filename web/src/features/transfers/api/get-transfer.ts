import { httpClient } from '@/lib/http/client';
import { TransferData } from '../types';

export const getTransfer = async (id: string): Promise<TransferData> => {
  const { data } = await httpClient(`/transfers/${id}`);
  return data;
};
