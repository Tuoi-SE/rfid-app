'use client';

import { Search, Bell, Settings, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

export function Header() {
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
    <header className="h-[72px] bg-white border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-40">
      {/* Left section */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="text-slate-400">Điều hướng</span>
          <span className="text-slate-300">›</span>
          <span className="text-primary font-bold">{getPageName(pathname)}</span>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Tìm kiếm tài sản, thẻ RFID..."
            className="w-80 h-10 pl-11 pr-4 bg-slate-50 border border-transparent hover:border-slate-200 focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/10 rounded-full text-sm outline-none transition-all placeholder:text-slate-400 text-slate-700"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-5 pr-2">
          <button className="relative w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-all">
            <Bell className="w-5 h-5 stroke-2" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border border-white rounded-full"></span>
          </button>
          <button className="relative w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-all">
            <Settings className="w-5 h-5 stroke-2" />
          </button>
        </div>

        <div className="w-px h-8 bg-slate-100"></div>

        <div className="relative" ref={profileRef}>
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors">
                {user?.username || 'Admin User'}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {roleText}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm tracking-widest shadow-sm group-hover:shadow-primary/30 transition-shadow">
                {getInitials(user?.username)}
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>

          {/* Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-lg shadow-slate-200/50 border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 border-b border-slate-50 mb-1">
                <p className="text-sm font-semibold text-slate-800">{user?.username || 'Admin User'}</p>
                <p className="text-xs text-slate-500 truncate">{user?.role === 'ADMIN' ? 'Phiên làm việc quản trị' : 'Phiên bảo mật kho'}</p>
              </div>
              
              <button 
                onClick={() => setIsProfileOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors"
              >
                <User className="w-4 h-4" />
                Hồ sơ cá nhân
              </button>
              
              <div className="h-px bg-slate-100 my-1"></div>
              
              <button 
                onClick={() => {
                  setIsProfileOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
