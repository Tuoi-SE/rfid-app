'use client';

import { useAuth } from '@/providers/AuthProvider';
import { getRoleDisplayName } from '@/utils/role-helpers';
import { Mail, ArrowRight, Edit, X, User, LogOut } from 'lucide-react';
import { useState } from 'react';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const roleText = getRoleDisplayName(user?.role);
  
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangePasswordOpen(false);
    alert('Đổi mật khẩu thành công!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      {/* Header Layout */}
      <div className="mb-6 flex flex-col gap-1">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
          <span className="cursor-pointer hover:text-slate-800 transition-colors">🏠</span>
          <span>/</span>
          <span className="font-medium">Trang cá nhân</span>
        </div>
        <h1 className="text-2xl font-black text-[#4c59a8] tracking-widest uppercase">Trang cá nhân</h1>
        <p className="text-slate-500 text-sm font-medium">Tất cả thông tin của bạn đều được bảo mật và an toàn.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative">
        {/* Banner */}
        <div className="h-48 w-full bg-[#0B1B3D] overflow-hidden relative">
          <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1510146758428-e5e4b17b8b6a?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>
          {/* Subtle grid pattern over it to look like brick */}
          <div className="absolute inset-0 border-t border-white/5 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        </div>

        {/* Profile Info Area */}
        <div className="px-6 pb-8 sm:px-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16 mb-10 gap-4">
            <div className="flex items-end gap-5">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-[120px] h-[120px] rounded-full border-4 border-white bg-[#30A62A] flex items-center justify-center shadow-lg relative overflow-hidden">
                  <User className="text-white w-16 h-16" strokeWidth={2.5} />
                </div>
              </div>
              
              <div className="mb-2">
                <h2 className="text-[28px] font-bold text-slate-800 tracking-tight leading-none">{user?.username || 'Carrier'}</h2>
                <p className="text-slate-500 font-medium mt-1">{user?.email || 'cuquangtuoi11@gmail.com'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={logout} className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors shadow-sm">
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] bg-[#4c59a8] hover:bg-[#3f4a8c] text-white font-semibold transition-colors shadow-sm">
                <Edit className="w-4 h-4" />
                Chỉnh sửa
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Họ và Tên</label>
              <input type="text" readOnly value={user?.username || 'Carrier'} className="w-full px-4 py-3.5 bg-slate-50/70 border border-slate-200 rounded-[12px] text-slate-600 focus:outline-none pointer-events-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Số điện thoại</label>
              <input type="text" readOnly value="0923478272" className="w-full px-4 py-3.5 bg-slate-50/70 border border-slate-200 rounded-[12px] text-slate-600 focus:outline-none pointer-events-none" />
            </div>
            <div className="md:col-span-2 md:w-[49%]">
              <label className="block text-sm font-bold text-slate-700 mb-2">Vai trò</label>
              <input type="text" readOnly value={roleText || 'Đại diện doanh nghiệp'} className="w-full px-4 py-3.5 bg-slate-50/70 border border-slate-200 rounded-[12px] text-slate-600 focus:outline-none pointer-events-none" />
            </div>
          </div>

          {/* Email và Bảo mật */}
          <div>
            <h3 className="text-[20px] font-bold text-slate-800 mb-6">Email và Bảo mật</h3>
            
            <div className="space-y-4">
              
              {/* Email component */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-slate-100 pb-6">
                <div className="flex items-start gap-4">
                  <div className="w-[42px] h-[42px] rounded-full bg-blue-50/80 text-blue-500 flex items-center justify-center shrink-0">
                    <Mail className="w-[22px] h-[22px]" />
                  </div>
                  <div className="pt-0.5">
                    <h4 className="font-bold text-slate-800 text-[15px]">Địa chỉ Email</h4>
                    <p className="text-sm text-slate-500 mt-1">{user?.email || 'cuquangtuoi11@gmail.com'}</p>
                  </div>
                </div>
                <button className="px-6 py-2.5 rounded-[12px] border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors text-sm sm:w-auto w-full shadow-sm">
                  Thay đổi
                </button>
              </div>

              {/* Password component */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
                <div className="flex items-start gap-4">
                  <div className="w-[42px] h-[42px] rounded-full bg-indigo-50/80 text-indigo-500 flex items-center justify-center shrink-0">
                    <LogOut className="w-[22px] h-[22px] rotate-180" />
                  </div>
                  <div className="pt-0.5">
                    <h4 className="font-bold text-slate-800 text-[15px]">Mật khẩu</h4>
                    <p className="text-sm text-slate-500 mt-1">Lần cập nhật cuối: 2 tháng trước</p>
                  </div>
                </div>
                <button onClick={() => setIsChangePasswordOpen(true)} className="px-6 py-2.5 rounded-[12px] border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors text-sm sm:w-auto w-full shadow-sm">
                  Thay đổi
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsChangePasswordOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Thay đổi mật khẩu</h3>
              <button onClick={() => setIsChangePasswordOpen(false)} className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-slate-50 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Mật khẩu hiện tại</label>
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium" 
                  placeholder="Nhập mật khẩu hiện tại"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Mật khẩu mới</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium" 
                  placeholder="Nhập mật khẩu mới"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Xác nhận mật khẩu mới</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium" 
                  placeholder="Nhập lại mật khẩu mới"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-[12px] transition-colors shrink-0"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 text-sm font-bold text-white bg-[#4c59a8] hover:bg-[#3f4a8c] rounded-[12px] transition-colors shadow-md shadow-primary/20 shrink-0"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
