'use client';
import { Tag, Search, Radio, Download, Upload, LogOut, Activity } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', href: '/', icon: Search },
    { name: 'Quản lý Tags', href: '/tags', icon: Tag, exact: true },
    { name: 'Live Capture (Gán tên)', href: '/tags/live', icon: Activity },
    { name: 'Phiên quét (Sessions)', href: '/sessions', icon: Radio },
  ];

  const toolItems = [
    { name: 'Import Excel', href: '/tags/import', icon: Upload },
    { name: 'Xuất Báo Cáo', href: '/reports', icon: Download },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  return (
    <div className="flex bg-slate-900 border-r border-slate-800 text-slate-300 w-64 flex-col h-screen fixed">
      <div className="flex h-16 shrink-0 items-center px-6 font-bold text-white tracking-wide border-b border-slate-800 gap-2">
        <Radio className="w-5 h-5 text-indigo-400" />
        RFID Admin
      </div>
      <nav className="flex flex-1 flex-col p-4 gap-2">
        {menuItems.map(item => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href) && item.href !== '/' || pathname === item.href;
          
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                isActive 
                ? 'bg-indigo-900/40 text-indigo-400 border border-indigo-900/50' 
                : 'hover:bg-slate-800 hover:text-white border border-transparent'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
        
        <div className="mt-8 border-t border-slate-800 pt-4 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Công cụ</div>
        
        {toolItems.map(item => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href} 
               className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                isActive 
                ? 'bg-indigo-900/40 text-indigo-400 border border-indigo-900/50' 
                : 'hover:bg-slate-800 hover:text-white border border-transparent'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-md hover:bg-red-900/30 text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
