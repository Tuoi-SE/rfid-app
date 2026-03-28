import React from 'react';
import { Server, Activity, HardDrive, RotateCw } from 'lucide-react';

export const SystemHealthIndicators = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
      {/* 1. Gateway Status */}
      <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
          <Server className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">
              Trạng thái Gateway
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 leading-none mb-1">
            KẾT NỐI
          </div>
          <div className="text-sm text-slate-500 font-medium">
            3 Node Hoạt động
          </div>
        </div>
      </div>

      {/* 2. System Latency */}
      <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">
              Độ trễ Hệ thống
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 leading-none mb-1">
            24ms
          </div>
          <div className="text-sm text-slate-500 font-medium">
            Mức tối ưu
          </div>
        </div>
      </div>

      {/* 3. Storage Cap */}
      <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
          <HardDrive className="w-5 h-5" />
        </div>
        <div className="w-full">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">
              Dung lượng lưu trữ
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 leading-none mb-2">
            64.2%
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1">
            <div className="h-full bg-orange-400 rounded-full" style={{ width: '64.2%' }} />
          </div>
          <div className="text-xs text-slate-500 font-medium text-right">
            Trống 2.4 TB
          </div>
        </div>
      </div>

      {/* 4. Last Backup */}
      <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
          <RotateCw className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">
              Sao lưu gần nhất
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 leading-none mb-1">
            10p trước
          </div>
          <div className="text-sm text-slate-500 font-medium">
            Auto-sync: BẬT
          </div>
        </div>
      </div>
    </div>
  );
};
