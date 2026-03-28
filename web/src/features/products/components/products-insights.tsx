import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export const ProductsInsights = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white rounded-[20px] p-6 border border-slate-100 shadow-sm flex items-center gap-5">
        <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        </div>
        <div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ĐÃ GÁN RFID</div>
          <div className="text-[28px] font-bold text-[#04147B] leading-none">98.2%</div>
        </div>
      </div>
      
      <div className="bg-white rounded-[20px] p-6 border border-slate-100 shadow-sm flex items-center gap-5">
        <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
          <AlertCircle className="w-6 h-6 text-amber-500" />
        </div>
        <div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">LỖI/MẤT TÍN HIỆU</div>
          <div className="text-[28px] font-bold text-[#04147B] leading-none">14 <span className="text-lg font-bold text-slate-500">sản phẩm</span></div>
        </div>
      </div>

      <div className="bg-white rounded-[20px] p-6 border border-slate-100 shadow-sm flex items-center gap-5">
        <div className="w-14 h-14 rounded-full bg-[#EEF2FF] flex items-center justify-center shrink-0">
          <RefreshCw className="w-6 h-6 text-[#04147B]" />
        </div>
        <div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">CẬP NHẬT CUỐI</div>
          <div className="text-[22px] font-bold text-[#04147B] leading-none">2 phút trước</div>
        </div>
      </div>
    </div>
  );
};
