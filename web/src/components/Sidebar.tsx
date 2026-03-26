'use client';
import { Tag, Search, Radio, Download, Upload, LogOut, Activity, Package, FolderTree, Users, BarChart3, ClipboardList, Warehouse } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', href: '/', icon: BarChart3, exact: true },
    { name: 'Danh mục', href: '/categories', icon: FolderTree },
    { name: 'Sản phẩm', href: '/products', icon: Package },
    { name: 'Quản lý Tags', href: '/tags', icon: Tag, exact: true },
    { name: 'Phiếu XNK (Đơn)', href: '/orders', icon: ClipboardList },
    { name: 'Tồn kho', href: '/inventory', icon: Warehouse },
    { name: 'Phiên quét (Log)', href: '/sessions', icon: Radio },
  ];

  const adminItems = [
    { name: 'Người dùng', href: '/users', icon: Users },
    { name: 'Activity Logs', href: '/activity-logs', icon: ClipboardList },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || (pathname.startsWith(href) && href !== '/');
  };

  return (
    <div className="flex bg-slate-900 border-r border-slate-800 text-slate-300 w-64 flex-col h-screen fixed">
      <div className="flex h-16 shrink-0 items-center px-6 font-bold text-white tracking-wide border-b border-slate-800 gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-lg flex items-center justify-center">
          <Radio className="w-4 h-4 text-white" />
        </div>
        RFID Admin
      </div>

      <nav className="flex flex-1 flex-col p-4 gap-1 overflow-y-auto">
        <div className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Quản lý
        </div>
        {menuItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 text-sm ${
              isActive(item.href, item.exact)
                ? 'bg-indigo-500/15 text-indigo-400 font-medium'
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {item.name}
          </Link>
        ))}

        {user?.role === 'ADMIN' && (
          <>
            <div className="mt-6 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Quản trị
            </div>
            {adminItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 text-sm ${
                  isActive(item.href)
                    ? 'bg-indigo-500/15 text-indigo-400 font-medium'
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.name}
              </Link>
            ))}
          </>
        )}

        <div className="mt-6 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Công cụ
        </div>
        <Link href="/tags/import" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-slate-800 hover:text-white transition-all">
          <Upload className="w-4 h-4 shrink-0" />
          Import Excel
        </Link>
        <Link href="/reports" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-slate-800 hover:text-white transition-all">
          <Download className="w-4 h-4 shrink-0" />
          Xuất Báo Cáo
        </Link>
      </nav>

      {/* User info + Logout */}
      <div className="p-4 border-t border-slate-800">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold uppercase">
              {user.username.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.username}</p>
              <p className="text-xs text-slate-500">{user.role === 'ADMIN' ? 'Quản trị viên' : 'Nhân viên kho'}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-lg hover:bg-red-900/30 text-red-400 transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
