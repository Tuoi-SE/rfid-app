'use client';

import { useAuth } from '@/providers/AuthProvider';
import { getRoleDisplayName } from '@/utils/role-helpers';
import { Mail, ArrowRight, Edit, X, User, LogOut, Camera, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { changePassword } from '@/features/auth/api/change-password';
import { requestChangeEmail } from '@/features/auth/api/change-email';
import { updateProfile } from '@/features/auth/api/update-profile';
import { AuthStorage } from '@/lib/http/auth-storage';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, login } = useAuth();
  const router = useRouter();

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isChangeEmailOpen, setIsChangeEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');

  const roleText = getRoleDisplayName(user?.role);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFullName, setEditFullName] = useState(user?.fullName || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  useEffect(() => {
    if (!isEditingProfile) {
      setEditFullName(user?.fullName || '');
      setEditPhone(user?.phone || '');
    }
  }, [user, isEditingProfile]);

  // Avatar handling
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = import('react').then(m => null); // Temporarily until I add useRef

  const handleAvatarClick = () => {
    const input = document.getElementById('avatar-input') as HTMLInputElement;
    input?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
    }
  };

  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return;

    setIsChangingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword });
      toast.success('Đổi mật khẩu thành công!');
      setIsChangePasswordOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error?.message || 'Lỗi xảy ra khi đổi mật khẩu.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const [isChangingEmail, setIsChangingEmail] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingEmail(true);
    try {
      await requestChangeEmail({ currentPassword, newEmail });
      toast.success('Đã gửi mã OTP. Vui lòng kiểm tra email cũ của bạn.');
      setIsChangeEmailOpen(false);
      
      const email = user?.email || '';
      AuthStorage.removeToken(); // Force local logout without triggering AuthProvider's immediate /login redirect
      window.location.href = `/verify-email-change?email=${encodeURIComponent(email)}`;
    } catch (error: any) {
      toast.error(error?.message || 'Có lỗi xảy ra khi yêu cầu đổi email.');
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editFullName.trim()) {
      toast.error('Họ và tên không được để trống');
      return;
    }
    if (editPhone && !/(84|0[3|5|7|8|9])+([0-9]{8})\b/.test(editPhone)) {
      toast.error('Số điện thoại không hợp lệ');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const res = await updateProfile({ fullName: editFullName, phone: editPhone });
      if (res && res.access_token) {
        // Gọi login để cập nhật token & decode lại thông tin mới, không redirect
        login(res.access_token, res.refresh_token, true, true);
      }
      toast.success('Cập nhật thông tin thành công!');
      setIsEditingProfile(false);
    } catch (error: any) {
      toast.error(error?.message || 'Có lỗi xảy ra khi cập nhật thông tin.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      {/* Header Layout */}
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-black text-[#4c59a8] tracking-widest uppercase">Hồ sơ cá nhân</h1>
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
                <div className="w-[132px] h-[132px] rounded-full border-[6px] border-white bg-[#30A62A] flex items-center justify-center shadow-md relative overflow-hidden group">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="text-white w-[60px] h-[60px]" strokeWidth={2} />
                  )}

                  {/* Camera Overlay */}
                  <div
                    onClick={handleAvatarClick}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Camera className="text-white w-8 h-8" />
                  </div>
                </div>

                {/* Hidden File Input */}
                <input
                  id="avatar-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <div className="translate-y-2 sm:translate-y-3">
                <h2 className="text-[32px] font-extrabold text-slate-800 tracking-tight leading-none mb-1">{user?.fullName || user?.username || 'Chưa đặt tên'}</h2>
                <p className="text-slate-500 font-medium text-[15px]">{user?.email || 'Chưa thiết lập email'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:mb-3">
              {!isEditingProfile ? (
                 <button 
                   onClick={() => setIsEditingProfile(true)} 
                   className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-[12px] bg-[#4c59a8] hover:bg-[#3f4a8c] text-white font-bold transition-colors shadow-sm text-[14px]"
                 >
                   <Edit className="w-[18px] h-[18px]" />
                   Chỉnh sửa hồ sơ
                 </button>
              ) : (
                <>
                  <button 
                    onClick={() => setIsEditingProfile(false)}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-[12px] border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm text-[14px]"
                  >
                    Hủy
                  </button>
                  <button 
                    onClick={handleSaveProfile}
                    disabled={isUpdatingProfile}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-[12px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-sm text-[14px]"
                  >
                    {isUpdatingProfile ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : 'Lưu thay đổi'}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-7 mb-14">
            <div>
              <label className="block text-[13px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Họ và Tên</label>
              <input 
                type="text" 
                readOnly={!isEditingProfile} 
                value={editFullName} 
                onChange={(e) => setEditFullName(e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-[12px] font-medium text-sm focus:outline-none transition-colors ${
                  isEditingProfile 
                    ? 'bg-white border-blue-500 focus:ring-4 focus:ring-blue-100 text-slate-800' 
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Số điện thoại {isEditingProfile ? '' : '(Cố định)'}</label>
              <div className="relative">
                <input 
                  type="text" 
                  readOnly={!isEditingProfile} 
                  value={editPhone} 
                  onChange={(e) => setEditPhone(e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-[12px] font-bold text-sm focus:outline-none transition-colors ${
                    isEditingProfile 
                      ? 'bg-white border-blue-500 focus:ring-4 focus:ring-blue-100 text-slate-800' 
                      : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                />
                {!isEditingProfile && (
                  <p className="mt-1.5 text-[11px] text-slate-400 italic text-right">* Bấm 'Chỉnh sửa hồ sơ' để thay đổi thông tin.</p>
                )}
              </div>
            </div>
            <div className="md:col-span-2 md:w-full">
              <label className="block text-[13px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Vai trò (Cố định)</label>
              <div className="relative">
                <input type="text" readOnly value={roleText || 'QUẢN TRỊ VIÊN'} className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-[12px] text-slate-400 font-bold text-sm focus:outline-none transition-colors uppercase cursor-not-allowed" />
                <p className="mt-1.5 text-[11px] text-slate-400 italic">* Vai trò được thiết lập bởi quản trị viên hệ thống để đảm bảo bảo mật.</p>
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
                  disabled={!currentPassword || !newEmail || isChangingEmail}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-[12px] transition-colors shadow-md shadow-blue-600/20 shrink-0 flex items-center justify-center gap-2"
                >
                  {isChangingEmail && <Loader2 className="w-4 h-4 animate-spin" />}
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

                {/* Password Strength Meter */}
                {newPassword && (
                  <div className="mt-2 px-1 max-w-[160px]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-medium text-slate-400">Độ mạnh</span>
                      <span className={`text-[10px] font-bold ${newPassword.length < 6 ? 'text-red-400' :
                        newPassword.length < 10 ? 'text-amber-400' : 'text-emerald-500'
                        }`}>
                        {newPassword.length < 6 ? 'yếu' : newPassword.length < 10 ? 'trung bình' : 'mạnh'}
                      </span>
                    </div>
                    <div className="flex gap-1 h-[2px]">
                      <div className={`flex-1 rounded-full transition-all duration-300 ${newPassword.length > 0 ? (newPassword.length < 6 ? 'bg-red-400' : 'bg-amber-400') : 'bg-slate-100'} ${newPassword.length >= 10 ? 'bg-emerald-500' : ''}`}></div>
                      <div className={`flex-1 rounded-full transition-all duration-300 ${newPassword.length >= 6 ? (newPassword.length < 10 ? 'bg-amber-400' : 'bg-emerald-500') : 'bg-slate-100'}`}></div>
                      <div className={`flex-1 rounded-full transition-all duration-300 ${newPassword.length >= 10 ? 'bg-emerald-500' : 'bg-slate-100'}`}></div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-2.5 bg-slate-50 border ${confirmPassword && newPassword !== confirmPassword ? 'border-red-300 focus:ring-red-100' : 'border-slate-200 focus:ring-primary/20'} rounded-[12px] focus:outline-none focus:ring-2 focus:border-primary transition-all text-sm font-medium`}
                  placeholder="Nhập lại mật khẩu mới"
                  required
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-500 font-medium animate-in fade-in slide-in-from-top-1 duration-200">
                    Mật khẩu chưa khớp
                  </p>
                )}
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
                  disabled={!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || isChangingPassword}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-[#4c59a8] hover:bg-[#3f4a8c] disabled:opacity-50 disabled:cursor-not-allowed rounded-[12px] transition-colors shadow-md shadow-primary/20 shrink-0 flex items-center justify-center gap-2"
                >
                  {isChangingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
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
