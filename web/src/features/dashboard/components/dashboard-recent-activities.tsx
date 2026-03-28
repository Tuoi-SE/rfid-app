import { Activity, Plus, Disc, ArrowUp } from 'lucide-react';

export const DashboardRecentActivities = () => {
  // Activities Mock to match Figma
  const activities = [
    { user: 'admin', bold: 'tạo phiếu', id: 'ORD-2026-001', desc: 'Hệ thống kho chính - Cơ sở 1', time: '2 phút trước', color: 'text-primary bg-primary/10 border-primary', icon: Plus },
    { user: 'Nhân viên kho A', bold: 'hoàn thành', id: 'Session 123', desc: '452 thẻ RFID đã được xác nhận', time: '45 phút trước', color: 'text-emerald-500 bg-emerald-50 border-emerald-500', icon: Disc },
    { user: 'Lô hàng #9920', bold: 'đang được chuyển đến', id: 'Vùng 2', desc: '', time: '1 giờ trước', color: 'text-amber-500 bg-amber-50 border-amber-500', icon: ArrowUp },
    { user: 'Phát hiện 5 tags', bold: 'không rõ nguồn gốc tại', id: 'Gateway 4', desc: '', time: '3 giờ trước', color: 'text-red-500 bg-red-50 border-red-500', icon: Disc },
  ];

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-primary stroke-[2.5]" />
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">Hoạt động gần đây</h2>
      </div>
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 relative">
        <div className="space-y-6">
          {activities.map((act, i) => (
            <div key={i} className="flex gap-4 relative">
              {/* Vertical line indicator */}
              {i !== activities.length - 1 && (
                <div className="absolute left-3.5 top-8 w-px h-10 bg-slate-100"></div>
              )}
              <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-white ${act.color}`}>
                <act.icon className="w-3.5 h-3.5 stroke-3" />
              </div>
              <div className="flex-1 pb-1">
                <div className="flex justify-between items-start mb-0.5">
                  <p className="text-[13px] text-slate-800 leading-snug">
                    <span className="font-bold">{act.user}</span> {act.bold} <span className="font-bold text-primary bg-primary/5 px-1 rounded">{act.id}</span>
                  </p>
                  <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap ml-2 leading-snug text-right w-8">{act.time.replace(' trước', '\ntrước')}</span>
                </div>
                {act.desc && <p className="text-[11px] text-slate-500 font-medium">{act.desc}</p>}
              </div>
            </div>
          ))}
        </div>
        <button className="w-full mt-6 py-3.5 rounded-2xl border border-slate-100 text-xs font-bold text-primary hover:bg-[#F8FAFC] transition-colors tracking-wide">
          XEM TẤT CẢ HOẠT ĐỘNG →
        </button>
      </div>
    </section>
  );
};
