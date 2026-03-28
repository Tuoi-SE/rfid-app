import { httpClient } from '@/lib/http/client';
import { ActivityLog } from '../types';

export const getActivityLogs = async (params?: string) => {
const query = params ? `?${params}` : '';
return httpClient<ActivityLog[] | { data: ActivityLog[] }>(`/activity-logs${query}`);
};
