import { Factory, Warehouse, BedDouble, Hash } from 'lucide-react';

interface MetricProps {
  factories: number;
  warehouses: number;
  hotels: number;
  totalTags: number;
}

export const LocationStatCards = ({ metrics }: { metrics: MetricProps }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6 mb-6">
      {/* Factory */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300">
        <div className="absolute -right-4 -top-4 text-slate-50 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12">
          <Factory className="w-32 h-32" />
        </div>
        <div className="relative">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">Xưởng may</h3>
          <div className="text-4xl font-black text-slate-800 tracking-tight mb-2">
            {metrics.factories.toString().padStart(2, '0')}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-500 bg-emerald-50 w-fit px-2 py-1 rounded-md">
            <span className="text-lg leading-none">↗</span> +2 trong tháng này
          </div>
        </div>
      </div>

      {/* Warehouse */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300">
        <div className="absolute -right-4 -top-4 text-slate-50 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12">
          <Warehouse className="w-32 h-32" />
        </div>
        <div className="relative">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">Kho tổng</h3>
          <div className="text-4xl font-black text-[#04147B] tracking-tight mb-2">
            {metrics.warehouses.toString().padStart(2, '0')}
          </div>
          <div className="text-[11px] font-bold text-slate-500 bg-slate-50 w-fit px-2 py-1 rounded-md">
            Ổn định
          </div>
        </div>
      </div>

      {/* Hotel & Spa */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300">
        <div className="absolute -right-4 -top-4 text-slate-50 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12">
          <BedDouble className="w-32 h-32" />
        </div>
        <div className="relative">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">Khách sạn & Spa</h3>
          <div className="text-4xl font-black text-slate-800 tracking-tight mb-2">
            {metrics.hotels.toString().padStart(2, '0')}
          </div>
          <div className="text-[11px] font-bold text-amber-600 bg-amber-50 w-fit px-2 py-1 rounded-md flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> 3 cần kiểm kê
          </div>
        </div>
      </div>

      {/* Total Tags */}
      <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300">
        <div className="absolute -right-4 -top-4 text-slate-50 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12">
          <Hash className="w-32 h-32" />
        </div>
        <div className="relative">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">Tổng số Tags</h3>
          <div className="text-4xl font-black text-slate-800 tracking-tight mb-2">
            {metrics.totalTags.toLocaleString('vi-VN')}
          </div>
          <div className="text-[11px] font-bold text-indigo-600 bg-indigo-50 w-fit px-2 py-1 rounded-md hover:bg-indigo-100 transition-colors cursor-pointer">
            Hiệu suất 99.8%
          </div>
        </div>
      </div>
    </div>
  );
};
