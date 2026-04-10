'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { changePassword } from '@/features/auth/api/change-password';
import { Loader2, AlertCircle, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';

export default function ChangePasswordPage() {
  const { token, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthLoading && !token) {
      router.replace('/login');
    }
  }, [isAuthLoading, token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentPassword) { setError('Vui lòng nhập mật khẩu hiện tại'); return; }
    if (newPassword.length < 6) { setError('Mật khẩu mới phải có ít nhất 6 ký tự'); return; }
    if (newPassword !== confirmPassword) { setError('Mật khẩu xác nhận không khớp'); return; }

    setIsLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setIsSuccess(true);
    } catch (err: any) {
      const msg = err?.message || err?.data?.message || 'Đã có lỗi xảy ra';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F4F7FE]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!token) return null; // Redirecting

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7FE]">
        <div className="bg-white rounded-[40px] p-14 shadow-2xl max-w-[520px] text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-900 mb-3">Đổi mật khẩu thành công!</h2>
          <p className="text-slate-500 mb-8">Mật khẩu của bạn đã được cập nhật.</p>
          <button onClick={() => router.push('/')} className="w-full py-4 bg-primary text-white font-black rounded-2xl hover:bg-[#000A5C] transition-colors">
            Đi đến Dashboard
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
          <h1 className="text-[28px] font-black text-slate-900 mb-2 tracking-tight">Đổi mật khẩu</h1>
          <p className="text-slate-500 mb-8">Bạn cần đặt mật khẩu mới trước khi sử dụng hệ thống.</p>

          {error && (
            <div className="flex items-center gap-3 bg-red-50 text-red-600 px-6 py-4 rounded-2xl mb-6 text-base font-bold border border-red-100">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-2">Mật khẩu hiện tại</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Nhập mật khẩu hiện tại" className="w-full pl-14 pr-12 py-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary font-bold" />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-2">Mật khẩu mới</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Ít nhất 6 ký tự" className="w-full pl-14 pr-12 py-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary font-bold" />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-2">Xác nhận mật khẩu mới</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Nhập lại mật khẩu mới" className="w-full pl-14 pr-12 py-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary font-bold" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full py-4.5 bg-primary hover:bg-[#000A5C] text-white font-black rounded-2xl text-lg transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-3 shadow-lg">
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Xác nhận đổi mật khẩu'}
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
