import { ActivityLogsPageClient } from '@/features/activity-logs/components/activity-logs-page-client';
import { AdminGuard } from '@/components/auth/AdminGuard';

const ActivityLogsPage = () => {
  return (
    <AdminGuard>
      <ActivityLogsPageClient />
    </AdminGuard>
  );
};

export default ActivityLogsPage;
