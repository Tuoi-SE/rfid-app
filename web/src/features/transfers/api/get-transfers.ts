import { httpClient } from '@/lib/http/client';

export const getTransfers = (query?: string) => {
  return httpClient(`/transfers${query ? `?${query}` : ''}`);
};

export const confirmTransfer = (id: string, scannedCount: number) => {
  return httpClient(`/transfers/${id}/confirm`, {
    method: 'POST',
    body: JSON.stringify({ scannedCount }) // Adjust payload based on backend needs
  });
};
