'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { forgotPassword } from '@/features/auth/api/forgot-password';

const ForgotPasswordPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setError('Vui lòng nhập địa chỉ Email');
      return;
    }
    if (!emailRegex.test(email)) {
      setError('Địa chỉ Email không hợp lệ');
      return;
    }

    setIsSubmitLoading(true);
    try {
      await forgotPassword(email);
      setIsSuccess(true);
    } catch {
      // Even on error from backend, show success to prevent email enumeration
      setIsSuccess(true);
    } finally {
      setIsSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7FE] relative overflow-hidden py-4 px-4 sm:px-6">
      {/* Background radial gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-100/40 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-[480px] sm:max-w-[520px]">
        {/* Main Card */}
        <div className="bg-white rounded-[40px] p-10 sm:p-14 shadow-[0_32px_64px_rgba(0,0,0,0.08)] border border-slate-100">
          
          <button 
            onClick={() => router.push('/login')}
            className="flex items-center gap-3 text-slate-500 hover:text-primary transition-colors mb-10 text-base font-black group"
          >
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            Quay lại đăng nhập
          </button>

          <div className="text-center mb-10">
            <h1 className="text-[26px] sm:text-[30px] font-black text-slate-900 mb-3 tracking-tight">
              Quên mật khẩu?
            </h1>
            <p className="text-slate-500 text-base sm:text-lg leading-relaxed font-medium">
              {isSuccess 
                ? 'Vui lòng kiểm tra email của bạn để nhận hướng dẫn khôi phục mật khẩu.' 
                : 'Nhập email liên kết với tài khoản của bạn để nhận liên kết khôi phục.'}
            </p>
          </div>

          {isSuccess ? (
            <div className="space-y-8">
              <div className="flex flex-col items-center justify-center py-8 text-emerald-500 animate-in fade-in zoom-in duration-300">
                <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <p className="font-black text-slate-900 text-xl tracking-tight">Email đã được gửi!</p>
              </div>
              <button
                onClick={() => window.open('https://mail.google.com/', '_blank')}
                className="w-full py-4.5 sm:py-5 bg-primary hover:bg-[#000A5C] text-white font-black rounded-2xl text-base sm:text-lg transition-all duration-300 shadow-[0_20px_40px_rgba(0,15,138,0.35)] hover:shadow-[0_25px_50px_rgba(0,15,138,0.45)] hover:-translate-y-1 flex items-center justify-center gap-4"
              >
                Mở Gmail để lấy mật khẩu
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-3 bg-red-50 text-red-600 px-6 py-4 rounded-2xl mb-8 text-base font-bold border border-red-100 animate-in fade-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-[12px] sm:text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                    Địa chỉ Email
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="example@riotex.vn"
                      autoFocus
                      className="w-full pl-14 pr-5 py-4.5 bg-white border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary transition-all font-bold text-base sm:text-lg"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitLoading}
                  className="w-full py-4.5 sm:py-5 bg-primary hover:bg-[#000A5C] text-white font-black rounded-2xl text-base sm:text-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-4 shadow-[0_20px_40px_rgba(0,15,138,0.35)] hover:shadow-[0_25px_50px_rgba(0,15,138,0.45)] hover:-translate-y-1"
                >
                  {isSubmitLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    'Gửi yêu cầu khôi phục'
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="mt-10 pt-8 border-t border-slate-100">
            <p className="text-xs sm:text-sm text-slate-400 text-center leading-relaxed italic font-medium">
              * Nếu bạn không nhận được email, vui lòng kiểm tra thư mục Spam hoặc liên hệ Quản trị viên hệ thống (Admin).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-[10px] font-medium text-slate-400">
          © {new Date().getFullYear()} Inventory Pro. Một sản phẩm của Precision Curator Logistics.
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
