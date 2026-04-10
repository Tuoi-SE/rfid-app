'use client';

import { useAuth } from '@/providers/AuthProvider';
import { getRoleDisplayName } from '@/utils/role-helpers';
import { Mail, ArrowRight, Edit, X, User, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isChangeEmailOpen, setIsChangeEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  
  const roleText = getRoleDisplayName(user?.role);
  
  const [isUpdateProfileOpen, setIsUpdateProfileOpen] = useState(false);
  const [editFullName, setEditFullName] = useState(user?.fullName || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangePasswordOpen(false);
    alert('Đổi mật khẩu thành công!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangeEmailOpen(false);
    alert('Yêu cầu đổi email thành công. Vui lòng xác nhận qua email mới của bạn.');
    setNewEmail('');
    setCurrentPassword('');
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Giả lập gọi API update
      // await updateUser(user!.id, { fullName: editFullName, phone: editPhone });
      alert('Cập nhật thông tin thành công! Vui lòng đăng nhập lại để làm mới dữ liệu.');
      setIsUpdateProfileOpen(false);
    } catch (error) {
      alert('Có lỗi xảy ra khi cập nhật thông tin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      {/* Header Layout */}
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-black text-[#4c59a8] tracking-widest uppercase">Trang cá nhân</h1>
        <p className="text-slate-500 text-sm font-medium">Tất cả thông tin của bạn đều được bảo mật và an toàn.</p>
      </div>

      <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden relative">
        {/* Banner */}
        <div className="h-[200px] w-full bg-gradient-to-r from-[#031332] via-[#092055] to-[#041639] overflow-hidden relative flex items-center justify-center">
          {/* Subtle overlay effect */}
          <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>
          {/* Grid pattern overlay */}
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        </div>

        {/* Profile Info Area */}
        <div className="px-6 pb-12 sm:px-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16 mb-12 gap-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5">
              {/* Avatar */}
              <div className="relative group z-10 shrink-0">
                <div className="w-[132px] h-[132px] rounded-full border-[6px] border-white bg-[#30A62A] flex items-center justify-center shadow-md relative overflow-hidden">
                  <User className="text-white w-[60px] h-[60px]" strokeWidth={2} />
                </div>
              </div>
              
              <div className="mb-2 sm:mb-3">
                <h2 className="text-[32px] font-extrabold text-slate-800 tracking-tight leading-none mb-1.5">{user?.fullName || user?.username || 'Chưa đặt tên'}</h2>
                <p className="text-slate-500 font-medium text-[15px]">{user?.email || 'Chưa thiết lập email'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:mb-3">
              <button onClick={logout} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-[12px] border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm text-[14px]">
                <LogOut className="w-[18px] h-[18px]" />
                Đăng xuất
              </button>
              <button onClick={() => {
                setEditFullName(user?.fullName || '');
                setEditPhone(user?.phone || '');
                setIsUpdateProfileOpen(true);
              }} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-[12px] bg-[#4c59a8] hover:bg-[#3f4a8c] text-white font-bold transition-colors shadow-sm text-[14px]">
                <Edit className="w-[18px] h-[18px]" />
                Chỉnh sửa
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-7 mb-14">
            <div>
              <label className="block text-[14.5px] font-bold text-slate-700 mb-2.5">Họ và Tên</label>
              <input type="text" readOnly value={user?.fullName || 'Chưa cập nhật'} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[14px] text-slate-500 font-medium focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-[14.5px] font-bold text-slate-700 mb-2.5">Số điện thoại (Cố định)</label>
              <div className="relative">
                <input type="text" readOnly value={user?.phone || '0923478272'} className="w-full px-5 py-4 bg-slate-100 border border-slate-200 rounded-[14px] text-slate-400 font-bold focus:outline-none transition-colors cursor-not-allowed" />
                <p className="mt-2 text-xs text-slate-400 italic text-right">* Liên hệ quản trị viên để thay đổi số điện thoại.</p>
              </div>
            </div>
            <div className="md:col-span-2 md:w-full">
              <label className="block text-[14.5px] font-bold text-slate-700 mb-2.5">Vai trò (Cố định)</label>
              <div className="relative">
                <input type="text" readOnly value={roleText || 'QUẢN TRỊ VIÊN'} className="w-full px-5 py-4 bg-slate-100 border border-slate-200 rounded-[14px] text-slate-400 font-bold focus:outline-none transition-colors uppercase cursor-not-allowed" />
                <p className="mt-2 text-xs text-slate-400 italic">* Vai trò được thiết lập bởi quản trị viên hệ thống để đảm bảo bảo mật.</p>
              </div>
            </div>
          </div>

          {/* Email và Bảo mật */}
          <div>
            <h3 className="text-[22px] font-bold text-slate-800 mb-7">Email và Bảo mật</h3>
            
            <div className="space-y-1">
              
              {/* Email component */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5 border-b border-slate-100">
                <div className="flex items-start gap-5">
                  <div className="w-[48px] h-[48px] rounded-full bg-blue-50/80 text-blue-500 flex items-center justify-center shrink-0">
                    <Mail className="w-[24px] h-[24px]" />
                  </div>
                  <div className="pt-0.5">
                    <h4 className="font-bold text-slate-800 text-[16px]">Địa chỉ Email</h4>
                    <p className="text-[14.5px] text-slate-500 mt-1.5">{user?.email || 'Chưa thiết lập email'}</p>
                  </div>
                </div>
                <button onClick={() => setIsChangeEmailOpen(true)} className="px-6 py-2.5 rounded-[12px] border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 hover:text-slate-900 transition-colors text-[14px] sm:w-auto w-full shadow-sm">
                  Thay đổi
                </button>
              </div>

              {/* Password component */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5">
                <div className="flex items-start gap-5">
                  <div className="w-[48px] h-[48px] rounded-full bg-indigo-50/80 text-indigo-500 flex items-center justify-center shrink-0">
                    <LogOut className="w-[24px] h-[24px] rotate-180" />
                  </div>
                  <div className="pt-0.5">
                    <h4 className="font-bold text-slate-800 text-[16px]">Mật khẩu</h4>
                    <p className="text-[14.5px] text-slate-500 mt-1.5">Lần cập nhật cuối: 2 tháng trước</p>
                  </div>
                </div>
                <button onClick={() => setIsChangePasswordOpen(true)} className="px-6 py-2.5 rounded-[12px] border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 hover:text-slate-900 transition-colors text-[14px] sm:w-auto w-full shadow-sm">
                  Thay đổi
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Change Email Modal */}
      {isChangeEmailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsChangeEmailOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Cập nhật Email</h3>
              <button onClick={() => setIsChangeEmailOpen(false)} className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-slate-50 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEmailSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Mật khẩu hiện tại</label>
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium" 
                  placeholder="Nhập mật khẩu hiện tại để xác thực"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Địa chỉ Email mới</label>
                <input 
                  type="email" 
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium" 
                  placeholder="Nhập email mới của bạn"
                  required
                />
                <p className="mt-2 text-xs text-slate-500 mb-2">Mã xác nhận sẽ được gửi tới địa chỉ email mới của bạn.</p>
              </div>

              <div className="flex justify-end pt-1">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsChangeEmailOpen(false);
                    router.push('/forgot-password');
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Quên mật khẩu?
                </button>
              </div>

              <div className="pt-2 flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsChangeEmailOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-[12px] transition-colors shrink-0"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  disabled={!currentPassword || !newEmail}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-[12px] transition-colors shadow-md shadow-blue-600/20 shrink-0"
                >
                  Xác nhận thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

              <div className="flex justify-end pt-1">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsChangePasswordOpen(false);
                    router.push('/forgot-password');
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Quên mật khẩu?
                </button>
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
                  disabled={!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-[#4c59a8] hover:bg-[#3f4a8c] disabled:opacity-50 disabled:cursor-not-allowed rounded-[12px] transition-colors shadow-md shadow-primary/20 shrink-0"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Update Profile Modal */}
      {isUpdateProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsUpdateProfileOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Chỉnh sửa thông tin</h3>
              <button onClick={() => setIsUpdateProfileOpen(false)} className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-slate-50 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleProfileUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Họ và Tên</label>
                <input 
                  type="text" 
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium" 
                  placeholder="Nhập họ và tên của bạn"
                />
                <p className="mt-2 text-xs text-slate-400 italic">Lưu ý: Bạn chỉ có thể tự thay đổi Họ và Tên. Các thông tin khác vui lòng liên hệ Admin.</p>
              </div>

              <div className="pt-2 flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsUpdateProfileOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-[12px] transition-colors shrink-0"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-[#4c59a8] hover:bg-[#3f4a8c] rounded-[12px] transition-colors shadow-md shadow-primary/20 shrink-0"
                >
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
