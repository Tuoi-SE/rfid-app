import React from 'react';
import { RadioTower, ClipboardList, BarChart3, TrendingUp } from 'lucide-react';

export interface SessionMetrics {
  totalScanned: number;
  activeCount: number;
  activeUsernames?: string[];
  accuracy: number;
  latency?: number;
  trend?: string;
}

interface SessionStatCardsProps {
  metrics: SessionMetrics;
}

export const SessionStatCards = ({ metrics }: SessionStatCardsProps) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 xl:gap-4 2xl:gap-6 mb-4 xl:mb-6 2xl:mb-8">
      {/* 1. Total Tags Scanned */}
      <div className="bg-white rounded-2xl 2xl:rounded-[24px] p-4 xl:p-5 2xl:p-6 shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between relative overflow-hidden group">
        <div className="flex items-start justify-between mb-4 xl:mb-6 2xl:mb-8">
          <div className="w-9 h-9 xl:w-10 xl:h-10 2xl:w-12 2xl:h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
            <RadioTower className="w-4 h-4 xl:w-5 xl:h-5 2xl:w-6 2xl:h-6" />
          </div>
          {metrics.trend && (
            <div className="px-2 py-0.5 2xl:px-3 2xl:py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] xl:text-[10px] 2xl:text-xs font-bold tracking-wide flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {metrics.trend}
            </div>
          )}
        </div>
        <div>
          <p className="text-[9px] xl:text-[10px] 2xl:text-[11px] font-bold text-slate-400 tracking-widest uppercase mb-0.5 2xl:mb-1">
            Tổng thẻ đã quét
          </p>
          <div className="text-2xl xl:text-3xl 2xl:text-4xl font-black text-slate-900 tracking-tight">
            {metrics.totalScanned.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 2. Active Sessions */}
      <div className="bg-white rounded-2xl 2xl:rounded-[24px] p-4 xl:p-5 2xl:p-6 shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between relative overflow-hidden group">
        <div className="flex items-start justify-between mb-4 xl:mb-6 2xl:mb-8">
          <div className="w-9 h-9 xl:w-10 xl:h-10 2xl:w-12 2xl:h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
            <ClipboardList className="w-4 h-4 xl:w-5 xl:h-5 2xl:w-6 2xl:h-6" />
          </div>
          <div className="flex -space-x-2">
            {metrics.activeUsernames && metrics.activeUsernames.length > 0 ? (
              metrics.activeUsernames.map((username, idx) => (
                <div key={idx} className="w-6 h-6 xl:w-7 xl:h-7 2xl:w-8 2xl:h-8 rounded-full border-2 border-white bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold" title={username}>
                  {username.charAt(0).toUpperCase()}
                </div>
              ))
            ) : (
              <div className="w-6 h-6 xl:w-7 xl:h-7 2xl:w-8 2xl:h-8 rounded-full border-2 border-white bg-slate-200" />
            )}
          </div>
        </div>
        <div>
          <p className="text-[9px] xl:text-[10px] 2xl:text-[11px] font-bold text-slate-400 tracking-widest uppercase mb-0.5 2xl:mb-1">
            Phiên đang chạy
          </p>
          <div className="text-2xl xl:text-3xl 2xl:text-4xl font-black text-slate-900 tracking-tight">
            {metrics.activeCount.toString().padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* 3. Live Accuracy (Dark Theme) */}
      <div className="bg-[#04147B] rounded-2xl 2xl:rounded-[24px] p-4 xl:p-5 2xl:p-6 shadow-xl flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 2xl:w-32 2xl:h-32 bg-white/5 rounded-bl-[75px] 2xl:rounded-bl-[100px] pointer-events-none" />
        <div className="flex items-start justify-between mb-4 xl:mb-6 2xl:mb-8 relative z-10">
          <div className="w-9 h-9 xl:w-10 xl:h-10 2xl:w-12 2xl:h-12 rounded-full bg-white/10 flex items-center justify-center text-white">
            <BarChart3 className="w-4 h-4 xl:w-5 xl:h-5 2xl:w-6 2xl:h-6" />
          </div>
          <p className="text-[9px] xl:text-[10px] 2xl:text-[11px] font-bold text-white/70 tracking-widest uppercase mt-2">
            Độ chính xác
          </p>
        </div>
        <div className="relative z-10">
          <p className="text-[9px] xl:text-[10px] 2xl:text-[11px] font-bold text-white/50 tracking-widest uppercase mb-0.5 2xl:mb-1">
            Độ trễ tín hiệu EPC
          </p>
          <div className="text-2xl xl:text-3xl 2xl:text-4xl font-black text-white tracking-tight flex items-baseline gap-1">
            {metrics.latency || 24}
            <span className="text-[10px] xl:text-xs 2xl:text-xl text-white/70 font-bold">ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};
