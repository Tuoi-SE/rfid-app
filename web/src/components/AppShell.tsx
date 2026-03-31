'use client';
import { useAuth } from '@/providers/AuthProvider';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AppShell = ({ children }: { children: React.ReactNode }) => {
const { token, isLoading } = useAuth();
const pathname = usePathname();
const router = useRouter();
const [isSidebarOpen, setIsSidebarOpen] = useState(false);


const isLoginPage = pathname === '/login';

useEffect(() => {
if (isLoading) return;
if (!token && !isLoginPage) {
  router.push('/login');
}
if (token && isLoginPage) {
  router.push('/');
}
}, [token, isLoading, isLoginPage, router]);

// Close sidebar on route change
useEffect(() => {
  setIsSidebarOpen(false);
}, [pathname]);


// Loading state
if (isLoading) {
return (
  <div className="min-h-screen flex items-center justify-center bg-slate-900">
    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
  </div>
);
}

// Login page — no sidebar
if (isLoginPage) {
return <>{children}</>;
}

// Authenticated layout — with sidebar
if (!token) return null;

return (
<div className="flex h-screen bg-slate-50 lg:pl-56 overflow-hidden">
  {isSidebarOpen && (
    <div 
      className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
      onClick={() => setIsSidebarOpen(false)}
    />
  )}
  <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
  <div className="flex-1 flex flex-col h-full w-full transition-all duration-300">
    <Header onMenuClick={() => setIsSidebarOpen(true)} />
    <main className="flex-1 p-4 md:p-5 lg:p-6 overflow-y-auto flex flex-col min-h-0">
      {children}
    </main>
  </div>
</div>
);
};
