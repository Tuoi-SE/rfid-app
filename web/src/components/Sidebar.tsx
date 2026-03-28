'use client';
import { Tag, LayoutDashboard, Package, History, Users, ClipboardList, Warehouse, Radio, ShoppingCart, Boxes, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';

export const Sidebar = () => {
const pathname = usePathname();
const { user, logout } = useAuth();

const menuItems = [
{ name: 'Tổng quan', href: '/', icon: LayoutDashboard, exact: true },
{ name: 'Danh mục', href: '/categories', icon: Boxes },
{ name: 'Sản phẩm', href: '/products', icon: Package },
{ name: 'Thẻ RFID', href: '/tags', icon: Tag, exact: true },
{ name: 'Đơn hàng', href: '/orders', icon: ShoppingCart },
{ name: 'Tồn kho', href: '/inventory', icon: Warehouse },
{ name: 'Phiên quét', href: '/sessions', icon: History },
{ name: 'Người dùng', href: '/users', icon: Users, adminOnly: true },
{ name: 'Nhật ký', href: '/activity-logs', icon: ClipboardList, adminOnly: true },
];

const isActive = (href: string, exact?: boolean) => {
if (exact) return pathname === href;
return pathname === href || (pathname.startsWith(href) && href !== '/');
};

return (
<div className="flex bg-white border-r border-slate-100 w-64 flex-col h-screen fixed inset-y-0 z-50">
  {/* Header */}
  <div className="flex flex-col px-6 pt-8 pb-6">
    <h1 className="text-xl font-bold text-primary tracking-tight mb-1">
      RFID Admin
    </h1>
    <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
      QUẢN LÝ KHO VẬN
    </h2>
  </div>

  {/* Navigation List */}
  <nav className="flex flex-1 flex-col px-4 py-2 gap-1 overflow-y-auto">
    {menuItems.map(item => {
      if (item.adminOnly && user?.role !== 'ADMIN') return null;
      const active = isActive(item.href, item.exact);
      return (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 text-sm ${
            active
              ? 'bg-primary/5 text-primary font-bold'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-medium'
          }`}
        >
          <item.icon className="w-5 h-5 shrink-0 stroke-2" />
          {item.name}
        </Link>
      );
    })}
  </nav>

  {/* Bottom Actions */}
  <div className="p-4 mt-auto flex flex-col gap-3">
    <button className="flex items-center justify-center gap-2 w-full py-4 bg-primary hover:bg-primary-hover text-white rounded-2xl font-semibold text-sm shadow-md shadow-primary/20 transition-all active:scale-95">
      <Radio className="w-4 h-4" />
      Quét Mới
    </button>
  </div>
</div>
);
};
