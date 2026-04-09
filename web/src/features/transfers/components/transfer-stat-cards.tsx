import { ArrowRightLeft, PackageCheck, AlertOctagon, Hash } from 'lucide-react';

interface MetricProps {
  pending: number;
  completed: number;
  cancelled: number;
  totalTagsInTransit: number;
}

export const TransferStatCards = ({ metrics }: { metrics: MetricProps }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6 mb-6">
      {/* Pending */}
      <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300">
        <div className="absolute -right-4 -top-4 text-amber-500/10 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12">
          <ArrowRightLeft className="w-32 h-32" />
        </div>
        <div className="relative">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">Đang Vận Chuyển</h3>
          <div className="text-4xl font-black text-amber-500 tracking-tight mb-2">
            {metrics.pending.toString().padStart(2, '0')}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 bg-amber-50 w-fit px-2 py-1 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Đang chờ Giao - Nhận
          </div>
        </div>
      </div>

      {/* Completed */}
      <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300">
        <div className="absolute -right-4 -top-4 text-emerald-500/10 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12">
          <PackageCheck className="w-32 h-32" />
        </div>
        <div className="relative">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">Đã Hoàn Tất</h3>
          <div className="text-4xl font-black text-emerald-500 tracking-tight mb-2">
            {metrics.completed.toString().padStart(2, '0')}
          </div>
          <div className="text-[11px] font-bold text-slate-500 bg-slate-50 w-fit px-2 py-1 rounded-md">
            Đã lưu kho thành công
          </div>
        </div>
      </div>

      {/* Total Transit Tags */}
      <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300">
        <div className="absolute -right-4 -top-4 text-indigo-600/5 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12">
          <Hash className="w-32 h-32" />
        </div>
        <div className="relative">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">Khối Lượng Di Chuyển</h3>
          <div className="text-4xl font-black text-[#04147B] tracking-tight mb-2">
            {metrics.totalTagsInTransit.toLocaleString('vi-VN')}
          </div>
          <div className="text-[11px] font-bold text-indigo-600 bg-indigo-50 w-fit px-2 py-1 rounded-md">
            Thẻ đang chờ xử lý
          </div>
        </div>
      </div>

      {/* Cancelled */}
      <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300">
        <div className="absolute -right-4 -top-4 text-red-500/5 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12">
          <AlertOctagon className="w-32 h-32" />
        </div>
        <div className="relative">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">Cảnh Báo / Đã Hủy</h3>
          <div className="text-4xl font-black text-slate-800 tracking-tight mb-2">
            {metrics.cancelled.toString().padStart(2, '0')}
          </div>
          <div className="text-[11px] font-bold text-slate-500 bg-slate-50 w-fit px-2 py-1 rounded-md">
            Cần rà soát
          </div>
        </div>
      </div>
    </div>
  );
};
