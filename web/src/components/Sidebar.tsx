'use client';
import { Tag, LayoutDashboard, Package, History, Users, ClipboardList, Warehouse, Radio, ShoppingCart, Boxes, Truck, X, MapPin } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const pathname = usePathname();
  const { user } = useAuth();

  const menuGroups = [
    {
      title: 'QUY TRÌNH RFID',
      items: [
        { name: 'Phiên quét (Lô)', href: '/sessions', icon: History, exact: true },
        { name: 'Điều chuyển Xưởng', href: '/transfers', icon: Truck },
        { name: 'Đơn hàng / Xuất', href: '/orders', icon: ShoppingCart },
      ]
    },
    {
      title: 'KHO & SẢN PHẨM',
      items: [
        { name: 'Tồn kho', href: '/inventory', icon: Warehouse },
        { name: 'Vị trí / Địa điểm', href: '/locations', icon: MapPin },
        { name: 'Danh mục', href: '/categories', icon: Boxes },
        { name: 'Danh sách Sản phẩm', href: '/products', icon: Package },
        { name: 'Kho Thẻ RFID', href: '/tags', icon: Tag, exact: true },
      ]
    },
    {
      title: 'ĐIỀU HÀNH & HỆ THỐNG',
      adminOnly: true,
      items: [
        { name: 'Tổng quan Dashboard', href: '/', icon: LayoutDashboard, exact: true },
        { name: 'Tài khoản nội bộ', href: '/users', icon: Users },
        { name: 'Nhật ký hoạt động', href: '/activity-logs', icon: ClipboardList },
      ]
    }
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || (pathname.startsWith(href) && href !== '/');
  };

  return (
  <div className={`flex bg-white border-r border-slate-100 w-60 flex-col h-screen fixed inset-y-0 left-0 z-50 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
    {/* Header */}
    <div className="flex flex-col px-5 pt-6 pb-4 relative">
      <h1 className="text-[20px] font-black text-slate-800 tracking-tight mb-1 flex items-center gap-2">
        <Radio className="w-5 h-5 text-indigo-600" />
        RFID<span className="text-indigo-600">Sync</span>
      </h1>
      <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">
        Control Tower
      </h2>
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-6 right-3 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>

    {/* Navigation List by Group */}
    <nav className="flex flex-1 flex-col px-4 py-2 gap-5 overflow-y-auto mt-2">
      {menuGroups.map((group, idx) => {
        if (group.adminOnly && user?.role !== 'ADMIN') return null;
        
        return (
          <div key={idx} className="flex flex-col gap-1.5">
            <h3 className="text-[10px] font-bold text-slate-400 tracking-widest pl-3 uppercase mb-1">
              {group.title}
            </h3>
            {group.items.map(item => {
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-[13px] ${
                    active
                      ? 'bg-indigo-50/80 text-indigo-700 font-bold shadow-sm shadow-indigo-100/50'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-semibold'
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0 stroke-2" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>

  {/* Bottom Actions */}
  <div className="p-4 mt-auto flex flex-col gap-3">
    <button className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold text-xs shadow-md shadow-primary/20 transition-all active:scale-95">
      <Radio className="w-3.5 h-3.5" />
      Quét Mới
    </button>
  </div>
</div>
);
};
