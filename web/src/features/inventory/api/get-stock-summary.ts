import { httpClient } from '@/lib/http/client';
import { StockSummary } from '../types';

export async function getStockSummary() {
  return httpClient<StockSummary>('/inventory/stock-summary');
}
