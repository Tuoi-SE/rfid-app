'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { confirmChangeEmail } from '@/features/auth/api/change-email';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otp) return;

    setIsLoading(true);
    try {
      await confirmChangeEmail({ oldEmail: email, otp });
      toast.success('Đổi email thành công! Vui lòng đăng nhập lại.');
      router.push('/login');
    } catch (error: any) {
      toast.error(error?.message || 'Mã xác nhận không hợp lệ hoặc đã hết hạn.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-[#EEF2FF] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-[#E0E7FF] rotate-3 hover:rotate-6 transition-transform">
          <Mail className="w-8 h-8 text-[#04147B]" />
        </div>
        <h1 className="text-[28px] font-black text-slate-900 tracking-tight mb-3">Xác thực đổi Email</h1>
        <p className="text-[15px] font-medium text-slate-500 leading-relaxed max-w-[320px] mx-auto">
          Mã xác nhận gồm 6 số đã được gửi tới địa chỉ email hiện tại của bạn.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-[13px] font-bold text-slate-700 mb-2 uppercase tracking-wide">
            Email cũ cúa bạn
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#04147B] focus:ring-4 focus:ring-[#04147B]/10 transition-all font-medium text-[15px]"
            required
            readOnly={!!initialEmail}
            placeholder="Ví dụ: current@mail.com"
          />
        </div>

        <div>
          <label className="block text-[13px] font-bold text-slate-700 mb-2 uppercase tracking-wide">
            Mã xác nhận (OTP)
          </label>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#04147B] focus:ring-4 focus:ring-[#04147B]/10 transition-all font-bold text-[20px] tracking-[6px] text-center"
            required
            placeholder="••••••"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !otp || otp.length !== 6 || !email}
          className="w-full h-12 flex items-center justify-center gap-2 bg-[#04147B] hover:bg-[#030E59] active:bg-[#020A40] text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_16px_rgba(4,20,123,0.2)] hover:shadow-[0_12px_24px_rgba(4,20,123,0.3)] disabled:shadow-none"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Xác nhận thay đổi
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-[14px]">
        <Link href="/login" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#04147B] font-bold transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Quay lại màn hình đăng nhập
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7FE] relative overflow-hidden py-4 px-4 sm:px-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-100/40 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-[360px] sm:max-w-[400px]">
        <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-[0_15px_40px_rgba(0,0,0,0.05)] border border-slate-100">
          <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <VerifyEmailForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
