'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle2, Lock, Eye, EyeOff, Mail } from 'lucide-react';
import { resetPassword } from '@/features/auth/api/reset-password';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inputEmail, setInputEmail] = useState('');
  const [inputToken, setInputToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const tokenParams = searchParams.get('token');
  const emailParams = searchParams.get('email');

  useEffect(() => {
    if (tokenParams) {
      setInputToken(tokenParams);
    }
    if (emailParams) {
      setInputEmail(emailParams);
    }
  }, [tokenParams, emailParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!inputEmail) {
      setError('Vui lòng nhập địa chỉ email');
      return;
    }
    if (!inputToken || inputToken.length < 6) {
      setError('Vui lòng nhập mã khôi phục gồm 6 số');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword({ email: inputEmail, token: inputToken, newPassword: password });
      setIsSuccess(true);
    } catch (err: any) {
      const msg = err?.message || err?.data?.message || 'Đã có lỗi xảy ra';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7FE]">
        <div className="bg-white rounded-[40px] p-14 shadow-2xl max-w-[520px] text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-900 mb-3">Đặt lại mật khẩu thành công!</h2>
          <p className="text-slate-500 mb-8">Bạn có thể đăng nhập ngay với mật khẩu mới.</p>
          <button onClick={() => router.push('/login')} className="w-full py-4 bg-primary text-white font-black rounded-2xl hover:bg-[#000A5C] transition-colors">
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7FE] relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-100/40 rounded-full blur-[100px]" />
      </div>
      <div className="relative z-10 w-full max-w-[520px]">
        <div className="bg-white rounded-[40px] p-14 shadow-2xl border border-slate-100">
          <h1 className="text-[28px] font-black text-slate-900 mb-3 tracking-tight">Đặt mật khẩu mới</h1>
          <p className="text-slate-500 mb-8">Nhập mật khẩu mới cho tài khoản của bạn.</p>

          {error && (
            <div className="flex items-center gap-3 bg-red-50 text-red-600 px-6 py-4 rounded-2xl mb-6 text-base font-bold border border-red-100">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-2">ĐỊA CHỈ EMAIL</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="email" value={inputEmail} onChange={e => setInputEmail(e.target.value)} placeholder="hello@example.com" disabled={!!emailParams} className="w-full pl-14 pr-5 py-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary font-bold disabled:bg-slate-50 disabled:text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-2">Mã khôi phục</label>
              <div className="relative">
                <input type="text" maxLength={6} value={inputToken} onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  setInputToken(val);
                }} placeholder="Nhập 6 số từ email" className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary font-bold text-center tracking-[0.5em] text-xl" />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-2">Mật khẩu mới</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Ít nhất 6 ký tự" className="w-full pl-14 pr-12 py-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary font-bold" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-2">Xác nhận mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Nhập lại mật khẩu" className="w-full pl-14 pr-12 py-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary font-bold" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full py-4.5 bg-primary hover:bg-[#000A5C] text-white font-black rounded-2xl text-lg transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-3 shadow-lg">
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Đặt mật khẩu mới'}
            </button>
          </form>
        </div>
        <div className="text-center mt-6 text-[12px] font-medium text-slate-400">
          © {new Date().getFullYear()} Inventory Pro.
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F4F7FE]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
