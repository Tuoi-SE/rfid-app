import { httpClient } from '@/lib/http/client';
import { DashboardSummaryResponse } from '../types';

export const getDashboardSummary = async () => {
return httpClient<{ data: DashboardSummaryResponse }>('/dashboard/summary');
};
