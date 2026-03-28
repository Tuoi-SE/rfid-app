import React from 'react';
import { RadioTower, ClipboardList, BarChart3, TrendingUp } from 'lucide-react';

export interface SessionMetrics {
  totalScanned: number;
  activeCount: number;
  accuracy: number;
  trend?: string;
}

interface SessionStatCardsProps {
  metrics: SessionMetrics;
}

export const SessionStatCards = ({ metrics }: SessionStatCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* 1. Total Tags Scanned */}
      <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between relative overflow-hidden group">
        <div className="flex items-start justify-between mb-8">
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
            <RadioTower className="w-6 h-6" />
          </div>
          {metrics.trend && (
            <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[12px] font-bold tracking-wide flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {metrics.trend}
            </div>
          )}
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mb-1">
            Tổng thẻ đã quét
          </p>
          <div className="text-4xl font-black text-slate-900 tracking-tight">
            {metrics.totalScanned.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 2. Active Sessions */}
      <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between relative overflow-hidden group">
        <div className="flex items-start justify-between mb-8">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div className="flex -space-x-2">
            <img className="w-8 h-8 rounded-full border-2 border-white" src="https://i.pravatar.cc/100?img=11" alt="Op 1" />
            <img className="w-8 h-8 rounded-full border-2 border-white" src="https://i.pravatar.cc/100?img=12" alt="Op 2" />
          </div>
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mb-1">
            Phiên đang chạy
          </p>
          <div className="text-4xl font-black text-slate-900 tracking-tight">
            {metrics.activeCount.toString().padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* 3. Live Accuracy (Dark Theme) */}
      <div className="bg-[#04147B] rounded-[24px] p-6 shadow-xl flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[100px] pointer-events-none" />
        <div className="flex items-start justify-between mb-8 relative z-10">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white">
            <BarChart3 className="w-6 h-6" />
          </div>
          <p className="text-[11px] font-bold text-white/70 tracking-widest uppercase mt-2">
            Độ chính xác
          </p>
        </div>
        <div className="relative z-10">
          <p className="text-[11px] font-bold text-white/50 tracking-widest uppercase mb-1">
            Độ trễ tín hiệu EPC
          </p>
          <div className="text-4xl font-black text-white tracking-tight flex items-baseline gap-1">
            {metrics.accuracy}
            <span className="text-xl text-white/70 font-bold">%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
