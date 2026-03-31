import { AdminGuard } from '@/components/auth/AdminGuard';
import { PermissionsMain } from '@/features/permissions/components/main';

const PermissionsPage = () => {
  return (
    <AdminGuard>
      <PermissionsMain />
    </AdminGuard>
  );
};

export default PermissionsPage;

