'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { loginAuth } from '@/features/auth/api/login';
import { changePassword } from '@/features/auth/api/change-password';
import { Eye, EyeOff, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

const LoginPageClient = () => {
const { login, token, isLoading: isAuthLoading } = useAuth();
const router = useRouter();

const [loginKey, setLoginKey] = useState('');
const [password, setPassword] = useState('');
const [showPassword, setShowPassword] = useState(false);
const [rememberMe, setRememberMe] = useState(false);
const [error, setError] = useState('');
const [errors, setErrors] = useState<{ loginKey?: string; password?: string }>({});
const [isSubmitLoading, setIsSubmitLoading] = useState(false);

const [forceChangeDialog, setForceChangeDialog] = useState(false);
const [tempAuthData, setTempAuthData] = useState<{ access_token: string; refresh_token: string } | null>(null);
const [newPassword, setNewPassword] = useState('');
const [confirmNewPassword, setConfirmNewPassword] = useState('');
const [isChangingPassword, setIsChangingPassword] = useState(false);
const [changePasswordError, setChangePasswordError] = useState('');

useEffect(() => {
// Nếu app đã load auth xong và phát hiện có token, tự động đẩy về Dashboard
if (!isAuthLoading && token) {
  router.replace('/');
}
}, [isAuthLoading, token, router]);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setErrors({});

  const newErrors: { loginKey?: string; password?: string } = {};

  if (!loginKey) {
    newErrors.loginKey = 'Vui lòng nhập email của bạn';
  }
  if (!password) {
    newErrors.password = 'Vui lòng nhập mật khẩu';
  }
  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  setIsSubmitLoading(true);
  try {
    const res = await loginAuth({ loginKey, password, deviceType: 'WEB' });

    // Redirect to change-password if forced reset
    if (res.mustChangePassword) {
      setTempAuthData(res);
      setForceChangeDialog(true);
      return;
    }

    login(res.access_token, res.refresh_token, rememberMe);
  } catch {
    setError('Email hoặc mật khẩu không đúng');
  } finally {
    setIsSubmitLoading(false);
  }
};

const handleChangePasswordSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setChangePasswordError('');
  if (newPassword !== confirmNewPassword) {
    setChangePasswordError('Mật khẩu mới không khớp');
    return;
  }
  if (newPassword.length < 6) {
    setChangePasswordError('Mật khẩu mới phải có ít nhất 6 ký tự');
    return;
  }

  setIsChangingPassword(true);
  try {
    await changePassword({ currentPassword: password, newPassword }, tempAuthData?.access_token);
    // login the user officially
    if (tempAuthData) {
      login(tempAuthData.access_token, tempAuthData.refresh_token, rememberMe);
    }
  } catch (err: any) {
    setChangePasswordError(err?.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.');
  } finally {
    setIsChangingPassword(false);
  }
};

// Nếu đang kiểm tra token hoặc đã có token rồi (chuẩn bị redirect đi), sẽ hiện màn hình xoay để tránh chớp giật giao diện cũ
if (isAuthLoading || token) {
return (
  <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7FE]">
    <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
    <p className="text-slate-500 text-sm font-medium">Đang chuyển hướng...</p>
  </div>
);
}

return (
<div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7FE] relative overflow-hidden py-4 px-4 sm:px-6">
  {/* Background radial gradients for subtle light theme texture */}
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[100px]" />
    <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-100/40 rounded-full blur-[100px]" />
  </div>

  <div className="relative z-10 w-full max-w-[360px] sm:max-w-[400px]">
    {/* Main Card */}
    <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-[0_15px_40px_rgba(0,0,0,0.05)] border border-slate-100">

      {/* Logo */}
      <div className="flex justify-center items-center h-12 sm:h-14 w-full mb-3 relative">
        <img
          src="/images/vtex-logo.png"
          alt="VTEX Logo"
          className="absolute w-[240px] sm:w-[260px] h-auto object-contain scale-50"
        />
      </div>

      {forceChangeDialog ? (
        <>
          <div className="text-center mb-6">
            <h1 className="text-[22px] sm:text-[24px] font-extrabold text-slate-900 mb-2 tracking-tight">
              Đổi Mật Khẩu
            </h1>
            <p className="text-slate-500 text-sm sm:text-base">
              Vì lý do bảo mật, bạn cần đổi mật khẩu mặc định trước khi tiếp tục
            </p>
          </div>

          {changePasswordError && (
            <div className="flex items-center gap-3 bg-red-50 text-red-600 px-5 py-3 rounded-2xl mb-6 text-base font-bold border border-red-100 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {changePasswordError}
            </div>
          )}

          <form onSubmit={handleChangePasswordSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="text-sm font-semibold text-[#1e293b]">Mật khẩu mới</label>
              <div className="relative group mt-1.5">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Nhập tối thiểu 6 ký tự"
                  autoFocus
                  className="w-full px-5 pr-12 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-[16px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium tracking-normal text-sm sm:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-[#1e293b]">Xác nhận mật khẩu</label>
              <div className="relative group mt-1.5">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={e => setConfirmNewPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full px-5 pr-12 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-[16px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium tracking-normal text-sm sm:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isChangingPassword}
              className="w-full py-3 sm:py-3.5 bg-[#4c59a8] hover:bg-[#3f4a8c] text-white font-bold rounded-[16px] text-base sm:text-lg transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-3 mt-4 shadow-[0_4px_12px_rgba(76,89,168,0.25)]"
            >
              {isChangingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Lưu và tiếp tục'}
            </button>
            <button
               type="button"
               disabled={isChangingPassword}
               onClick={() => { setForceChangeDialog(false); setTempAuthData(null); }}
               className="w-full py-3 sm:py-3.5 bg-transparent text-[#4c59a8] hover:bg-slate-50 font-bold rounded-[16px] text-base sm:text-lg transition-all duration-300 flex items-center justify-center gap-3 mt-2"
            >
              Quay lại đăng nhập
            </button>
          </form>
        </>
      ) : (
        <>
          <div className="text-center mb-6">
            <h1 className="text-[22px] sm:text-[24px] font-extrabold text-slate-900 mb-2 tracking-tight">
              RFID Inventory Manager
            </h1>
            <p className="text-slate-500 text-sm sm:text-base">
              Hệ thống quản lý kho chính xác
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-red-50 text-red-600 px-5 py-3 rounded-2xl mb-6 text-base font-bold border border-red-100 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Username Input */}
            <div>
              <label className="block text-sm font-semibold text-[#1e293b] mb-1.5">
                Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={loginKey}
                  onChange={e => setLoginKey(e.target.value)}
                  placeholder="Nhập email của bạn"
                  autoFocus
                  className={`w-full px-5 py-2.5 sm:py-3 bg-white border ${errors.loginKey ? 'border-[#ff9494] shadow-[0_0_0_1px_#ff9494]' : 'border-slate-200'} rounded-[16px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium text-sm sm:text-base`}
                />
              </div>
              {errors.loginKey && (
                <p className="mt-1.5 text-[#ff0000] text-sm font-medium px-1">
                  {errors.loginKey}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-[#1e293b]">
                  Mật khẩu
                </label>
              </div>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu của bạn"
                  className={`w-full px-5 pr-12 py-2.5 sm:py-3 bg-white border ${errors.password ? 'border-[#ff9494] shadow-[0_0_0_1px_#ff9494]' : 'border-slate-200'} rounded-[16px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium tracking-normal text-sm sm:text-base`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-[#ff0000] text-sm font-medium px-1">
                  {errors.password}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <button type="button" onClick={() => router.push('/forgot-password')} className="text-sm sm:text-base font-bold text-[#2563eb] hover:text-blue-700 transition-colors">
                Quên mật khẩu?
              </button>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2 pt-1">
              <label className="relative flex cursor-pointer items-center rounded-full">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="peer h-4 w-4 cursor-pointer appearance-none rounded-full border border-slate-300 transition-all checked:border-primary checked:bg-primary"
                />
                <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                </div>
              </label>
              <span className="text-xs sm:text-sm font-medium text-slate-600 cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
                Ghi nhớ đăng nhập
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitLoading}
              className="w-full py-3 sm:py-3.5 bg-[#4c59a8] hover:bg-[#3f4a8c] text-white font-bold rounded-[16px] text-base sm:text-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4 shadow-[0_4px_12px_rgba(76,89,168,0.25)]"
            >
              {isSubmitLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>
        </>
      )}

      {/* Card Footer */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex justify-center">
        <div className="flex items-center gap-2 text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-[11px] font-medium">Hệ thống bảo mật đầu cuối (SSL 256-bit)</span>
        </div>
      </div>
    </div>

    {/* Out-of-card Footer */}
    <div className="text-center mt-4 sm:mt-5 text-[10px] sm:text-xs font-medium text-slate-400 px-2 leading-relaxed">
      © {new Date().getFullYear()} Inventory Pro. Một sản phẩm của Precision Curator Logistics.
    </div>
  </div>
</div>
);
};

export default LoginPageClient;
