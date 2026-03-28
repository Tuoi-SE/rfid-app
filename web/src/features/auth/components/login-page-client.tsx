'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { loginAuth } from '@/features/auth/api/login';
import { Eye, EyeOff, Loader2, AlertCircle, User, Lock, LogIn, ShieldCheck } from 'lucide-react';
import Image from 'next/image';

const LoginPageClient = () => {
const { login, token, isLoading: isAuthLoading } = useAuth();
const router = useRouter();

const [username, setUsername] = useState('');
const [password, setPassword] = useState('');
const [showPassword, setShowPassword] = useState(false);
const [rememberMe, setRememberMe] = useState(false);
const [error, setError] = useState('');
const [isSubmitLoading, setIsSubmitLoading] = useState(false);
const [isForgotOpen, setIsForgotOpen] = useState(false);

useEffect(() => {
// Nếu app đã load auth xong và phát hiện có token, tự động đẩy về Dashboard
if (!isAuthLoading && token) {
  router.replace('/');
}
}, [isAuthLoading, token, router]);

const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault();
setError('');
setIsSubmitLoading(true);

try {
  const res = await loginAuth({ username, password });
  login(res.access_token, res.refresh_token, rememberMe);
} catch {
  setError('Tên đăng nhập hoặc mật khẩu không đúng');
} finally {
  setIsSubmitLoading(false);
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
<div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7FE] relative overflow-hidden">
  {/* Background radial gradients for subtle light theme texture */}
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[100px]" />
    <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-100/40 rounded-full blur-[100px]" />
  </div>

  <div className="relative z-10 w-full max-w-[460px] px-6">
    {/* Main Card */}
    <div className="bg-white rounded-[24px] p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">

      {/* Logo */}
      <div className="flex justify-center items-center h-16 w-full mb-6 relative">
        <img
          src="/images/vtex-logo.png"
          alt="VTEX Logo"
          className="absolute w-[280px] h-auto object-contain scale-50"
        />
      </div>

      <div className="text-center mb-8">
        <h1 className="text-[22px] font-bold text-slate-900 mb-1.5 tracking-tight">
          RFID Inventory Manager
        </h1>
        <p className="text-slate-500 text-sm">
          Hệ thống quản lý kho chính xác
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm font-medium border border-red-100">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Username Input */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
            Tên đăng nhập
          </label>
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Nhập tài khoản quản trị"
              autoFocus
              required
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-sm"
            />
          </div>
        </div>

        {/* Password Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              Mật khẩu
            </label>
            <button type="button" onClick={() => setIsForgotOpen(true)} className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors">
              Quên mật khẩu?
            </button>
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium tracking-widest text-sm"
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

        {/* Remember Me */}
        <div className="flex items-center gap-2.5 pt-1">
          <label className="relative flex cursor-pointer items-center rounded-full">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="peer h-5 w-5 cursor-pointer appearance-none rounded-full border border-slate-300 transition-all checked:border-primary checked:bg-primary"
            />
            <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
              </svg>
            </div>
          </label>
          <span className="text-sm font-medium text-slate-600 cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
            Ghi nhớ đăng nhập
          </span>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitLoading || !username || !password}
          className="w-full py-3.5 bg-primary hover:bg-[#000A5C] text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 shadow-[0_4px_14px_rgba(0,15,138,0.25)]"
        >
          {isSubmitLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Đăng nhập <LogIn className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
      </form>

      {/* Card Footer */}
      <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center">
        <div className="flex items-center gap-2 text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-medium">Hệ thống bảo mật đầu cuối (SSL 256-bit)</span>
        </div>
      </div>
    </div>

    {/* Out-of-card Footer */}
    <div className="text-center mt-8 text-xs font-medium text-slate-400">
      © {new Date().getFullYear()} Inventory Pro. Một sản phẩm của Precision Curator Logistics.
    </div>
  </div>

  {/* Forgot Password Modal */}
  {isForgotOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsForgotOpen(false)} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl scale-100 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-600 mb-4 mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Hệ Sinh Thái Nội Bộ</h3>
        <p className="text-slate-500 text-sm text-center mb-6 leading-relaxed">
          Đây là hệ thống quản lý kho khép kín. Nếu bạn quên mật khẩu, vui lòng liên hệ trực tiếp với <strong className="text-slate-700">Quản trị viên (Admin)</strong> để được cấp lại mật khẩu mới.
        </p>
        <button
          onClick={() => setIsForgotOpen(false)}
          className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl transition-colors text-sm"
        >
          Tôi đã hiểu
        </button>
      </div>
    </div>
  )}
</div>
);
};

export default LoginPageClient;
