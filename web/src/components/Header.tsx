'use client';

import { Search, Bell, Settings, User, LogOut, ChevronDown, Menu } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

export const Header = ({ onMenuClick }: { onMenuClick?: () => void }) => {
const { user, logout } = useAuth();
const pathname = usePathname();
const [isProfileOpen, setIsProfileOpen] = useState(false);
const profileRef = useRef<HTMLDivElement>(null);

useEffect(() => {
const handleClickOutside = (event: MouseEvent) => {
  if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
    setIsProfileOpen(false);
  }
};
document.addEventListener('mousedown', handleClickOutside);
return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);

// Format avatar initials (e.g., quanghiep -> QH)
const getInitials = (name?: string) => {
if (!name) return 'AU';
return name.substring(0, 2).toUpperCase();
};

const roleText = user?.role === 'ADMIN' ? 'QUẢN TRỊ VIÊN CẤP CAO' : 'NHÂN VIÊN KHO';

// Dynamic breadcrumb labels based on routes
const getPageName = (path: string) => {
if (path === '/') return 'Tổng quan';
if (path.startsWith('/categories')) return 'Danh mục';
if (path.startsWith('/products')) return 'Sản phẩm';
if (path.startsWith('/tags')) return 'Thẻ RFID';
if (path.startsWith('/orders')) return 'Đơn hàng';
if (path.startsWith('/inventory')) return 'Tồn kho';
if (path.startsWith('/sessions')) return 'Phiên quét';
if (path.startsWith('/users')) return 'Người dùng';
if (path.startsWith('/activity-logs')) return 'Nhật ký hệ thống';
return 'Quản trị';
};

return (
<header className="h-[60px] bg-white border-b border-slate-100 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40">
  {/* Left section */}
  <div className="flex items-center gap-2 sm:gap-4 w-full lg:w-auto">
    <button onClick={onMenuClick} className="lg:hidden p-1.5 -ml-1 text-slate-500 hover:bg-slate-100 rounded-lg shrink-0">
      <Menu className="w-[18px] h-[18px]" />
    </button>
    <div className="hidden lg:flex items-center gap-2 text-[13px] font-medium shrink-0 lg:ml-2">
      <span className="text-slate-400">Điều hướng</span>
      <span className="text-slate-300">›</span>
      <span className="text-primary font-bold">{getPageName(pathname)}</span>
    </div>

    <div className="relative group flex-1 lg:ml-6">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
      <input
        type="text"
        placeholder="Tìm kiếm tài sản, thẻ RFID..."
        className="w-full sm:w-56 lg:w-72 h-9 pl-9 pr-4 bg-slate-50 border border-transparent hover:border-slate-200 focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/10 rounded-full text-[13px] outline-none transition-all placeholder:text-slate-400 text-slate-700"
      />
    </div>
  </div>

  {/* Right section */}
  <div className="flex items-center gap-2 sm:gap-4">
    <div className="hidden sm:flex items-center gap-3 pr-2">
      <button className="relative w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-all">
        <Bell className="w-[18px] h-[18px] stroke-2" />
        <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 border border-white rounded-full"></span>
      </button>
      <button className="relative w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-all">
        <Settings className="w-[18px] h-[18px] stroke-2" />
      </button>
    </div>

    <div className="hidden sm:block w-px h-6 bg-slate-100"></div>

    <div className="relative" ref={profileRef}>
      <div 
        className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group"
        onClick={() => setIsProfileOpen(!isProfileOpen)}
      >
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-[13px] font-bold text-slate-800 group-hover:text-primary transition-colors">
            {user?.username || 'Admin User'}
          </span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            {roleText}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs tracking-widest shadow-sm group-hover:shadow-primary/30 transition-shadow">
            {getInitials(user?.username)}
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isProfileOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg shadow-slate-200/50 border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-2 border-b border-slate-50 mb-1">
            <p className="text-[13px] font-semibold text-slate-800">{user?.username || 'Admin User'}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.role === 'ADMIN' ? 'Phiên làm việc quản trị' : 'Phiên bảo mật kho'}</p>
          </div>
          
          <button 
            onClick={() => setIsProfileOpen(false)}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors"
          >
            <User className="w-3.5 h-3.5" />
            Hồ sơ cá nhân
          </button>
          
          <div className="h-px bg-slate-100 my-1"></div>
          
          <button 
            onClick={() => {
              setIsProfileOpen(false);
              logout();
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  </div>
</header>
);
};
