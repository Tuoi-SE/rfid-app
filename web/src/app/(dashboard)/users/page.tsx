import { UsersPageClient } from '@/features/users/components/users-page-client';
import { AdminGuard } from '@/components/auth/AdminGuard';

const UsersPage = () => {
  return (
    <AdminGuard>
      <UsersPageClient />
    </AdminGuard>
  );
};

export default UsersPage;
