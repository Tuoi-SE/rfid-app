import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const DashboardLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
return (
<ProtectedRoute>
  <AppShell>{children}</AppShell>
</ProtectedRoute>
);
};

export default DashboardLayout;
