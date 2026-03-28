import React from 'react';
import { Lightbulb, ArrowRight } from 'lucide-react';

export const SecurityAlertWidget = () => {
  return (
    <div className="bg-[#F4F7FF] rounded-2xl p-6 border border-blue-100 flex gap-4 mt-6 items-start relative overflow-hidden shadow-sm">
      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0 border border-blue-50 relative z-10">
        <Lightbulb className="w-6 h-6 text-[#04147B]" />
      </div>
      
      <div className="flex-1 relative z-10">
        <h4 className="text-[#04147B] font-bold text-base mb-1.5">Gợi ý Bảo mật</h4>
        <p className="text-slate-600 text-sm mb-3 max-w-4xl leading-relaxed">
          Hệ thống phát hiện có <span className="font-semibold text-slate-800 underline decoration-slate-300 underline-offset-2">12 lượt đăng nhập thất bại</span> từ địa chỉ IP 103.25.xx.xx trong 2 giờ qua. Bạn có muốn kích hoạt chế độ xác thực 2 bước (2FA) cho tất cả tài khoản Quản trị viên không?
        </p>
        <button className="text-[#04147B] font-bold text-sm flex items-center gap-1.5 hover:text-blue-800 hover:gap-2 transition-all group">
          Thiết lập ngay <ArrowRight className="w-4 h-4 transition-transform" />
        </button>
      </div>

      {/* Decorative soft blurred circles for "Brand Light" appeal */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-indigo-100/40 rounded-full blur-2xl translate-y-1/2"></div>
    </div>
  );
};
