import { DashboardMain } from '@/features/dashboard/components/main';
import { AdminGuard } from '@/components/auth/AdminGuard';

const DashboardPage = () => {
  return (
    <AdminGuard>
      <DashboardMain />
    </AdminGuard>
  );
};

export default DashboardPage;
