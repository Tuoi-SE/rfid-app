import { httpClient } from '@/lib/http/client';
import { StockSummary } from '../types';

export const getStockSummary = async () => {
return httpClient<StockSummary>('/inventory/stock-summary');
};
