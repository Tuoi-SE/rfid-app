import React from 'react';
import { ChevronDown, Search, BarChart3 } from 'lucide-react';

interface ActivityLogsToolbarProps {
  totalEvents: number;
}

export const ActivityLogsToolbar = ({ totalEvents }: ActivityLogsToolbarProps) => {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 mb-4">
      {/* Filters Area */}
      <div className="flex-1 flex flex-wrap lg:flex-nowrap gap-4">
        {/* Time Filter */}
        <div className="flex-1 min-w-[200px] border border-slate-200 bg-white rounded-xl p-3 shadow-sm hover:border-slate-300 transition-colors">
          <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Bộ lọc thời gian</label>
          <div className="flex items-center justify-between text-slate-700 font-medium">
            <span>24 giờ qua</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* Action Type Filter */}
        <div className="flex-1 min-w-[200px] border border-slate-200 bg-white rounded-xl p-3 shadow-sm hover:border-slate-300 transition-colors">
          <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Loại hành động</label>
          <div className="flex items-center justify-between text-slate-700 font-medium">
            <span>Tất cả hành động</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* User Search */}
        <div className="flex-1 min-w-[240px] border border-slate-200 bg-white rounded-xl p-3 shadow-sm hover:border-slate-300 transition-colors">
          <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Người thực hiện</label>
          <div className="flex items-center text-slate-700 font-medium gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm người dùng..." 
              className="bg-transparent border-none outline-none w-full text-slate-600 placeholder:text-slate-300 text-sm"
            />
          </div>
        </div>
      </div>

      {/* KPI Card */}
      <div className="lg:w-64 bg-[#04147B] rounded-xl p-4 shadow-lg text-white flex justify-between items-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative z-10">
          <div className="text-[10px] uppercase font-bold text-blue-200 mb-1 tracking-wider">Tổng sự kiện</div>
          <div className="text-3xl font-extrabold tracking-tight">
            {totalEvents.toLocaleString('en-US')}
          </div>
        </div>
        <div className="relative z-10 w-10 h-10 bg-white/10 rounded-lg border border-white/20 flex items-center justify-center backdrop-blur-sm">
          <BarChart3 className="w-5 h-5 text-blue-100" />
        </div>
      </div>
    </div>
  );
};
