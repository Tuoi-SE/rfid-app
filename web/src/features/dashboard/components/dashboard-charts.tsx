import { Disc } from 'lucide-react';

interface DashboardChartsProps {
  stats: any;
}

export const DashboardCharts = ({ stats }: DashboardChartsProps) => {
  const statusCards = [
    { label: 'TRONG KHO', value: stats?.tags_by_status?.IN_STOCK != null ? stats.tags_by_status.IN_STOCK.toLocaleString() : '—', dot: 'bg-emerald-500', bar: 'bg-emerald-500', barWidth: 'w-2/3', lightBar: 'bg-emerald-50' },
    { label: 'ĐÃ XUẤT', value: stats?.tags_by_status?.OUT_OF_STOCK != null ? stats.tags_by_status.OUT_OF_STOCK.toLocaleString() : '—', dot: 'bg-red-500', bar: 'bg-red-500', barWidth: 'w-1/3', lightBar: 'bg-red-50' },
    { label: 'ĐANG VẬN CHUYỂN', value: stats?.tags_by_status?.IN_TRANSIT != null ? stats.tags_by_status.IN_TRANSIT.toLocaleString() : '—', dot: 'bg-blue-600', bar: 'bg-blue-600', barWidth: 'w-1/6', lightBar: 'bg-blue-50' },
  ];

  return (
    <>
      {/* Trạng thái Tags */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Disc className="w-5 h-5 text-primary stroke-[2.5]" />
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Trạng thái Tags RFID</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statusCards.map((card, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between h-[140px]">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${card.dot}`}></span>
                <span className="text-[10px] font-black text-slate-500 tracking-widest leading-none mt-0.5">{card.label}</span>
              </div>
              <div>
                <div className="text-[34px] font-medium text-slate-800 tracking-tight leading-none mb-4">{card.value}</div>
                <div className={`w-full h-1.5 ${card.lightBar} rounded-full overflow-hidden`}>
                  <div className={`h-full ${card.bar} ${card.barWidth} rounded-full`}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Biểu đồ biến động */}
      <section>
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <h3 className="font-bold text-slate-800">Biến động tồn kho tuần qua</h3>
            <div className="flex items-center bg-slate-50 p-1 rounded-full border border-slate-100">
              <button className="px-5 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 rounded-full transition-colors">Ngày</button>
              <button className="px-5 py-1.5 text-xs font-bold bg-primary text-white rounded-full shadow-sm">Tuần</button>
            </div>
          </div>
          <div className="h-48 flex items-end justify-between gap-4 px-2">
            {/* CSS Bar Chart Mockup */}
            <div className="w-full bg-[#EEF2FF] rounded-t-xl h-24 hover:bg-primary/20 transition-colors"></div>
            <div className="w-full bg-[#EEF2FF] rounded-t-xl h-32 hover:bg-primary/20 transition-colors"></div>
            <div className="w-full bg-[#C7D2FE] rounded-t-xl h-20 hover:bg-primary/30 transition-colors"></div>
            <div className="w-full bg-primary rounded-t-xl h-40 shadow-lg relative"></div>
            <div className="w-full bg-[#C7D2FE] rounded-t-xl h-28 hover:bg-primary/30 transition-colors"></div>
            <div className="w-full bg-[#EEF2FF] rounded-t-xl h-20 hover:bg-primary/20 transition-colors"></div>
            <div className="w-full bg-[#EEF2FF] rounded-t-xl h-28 hover:bg-primary/20 transition-colors"></div>
          </div>
        </div>
      </section>
    </>
  );
};
