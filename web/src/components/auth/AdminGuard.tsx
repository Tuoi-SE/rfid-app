'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { Loader2 } from 'lucide-react';

export const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if auth loading has completed
    if (!isLoading) {
      if (!user) {
        router.replace('/login');
      } else if (user.role !== 'ADMIN') {
        router.replace('/sessions'); // Redirect non-admins to sessions page
      }
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7FE]">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-slate-500 text-sm font-medium">Đang kiểm tra quyền truy cập...</p>
      </div>
    );
  }

  // Only render children if user exists AND is an ADMIN
  if (!user || user.role !== 'ADMIN') {
    return null; // Return null while redirecting
  }

  return <>{children}</>;
};
