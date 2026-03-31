import { httpClient } from '@/lib/http/client';

export interface UserDashboardStats {
  data: {
    totalUsers: number;
    activeUsers: number;
    totalScansToday: number;
    securityStatus: 'SAFE' | 'WARNING';
  };
}

export const getDashboardStats = (): Promise<UserDashboardStats> => {
  return httpClient('/users/dashboard-stats');
};
