import React from 'react';
import { X, Trash2, type LucideIcon } from 'lucide-react';

export interface BulkAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: 'danger' | 'primary' | 'default';
}

export interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  actions: BulkAction[];
}

export const BulkActionsBar = ({
  selectedCount,
  onClearSelection,
  actions,
}: BulkActionsBarProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-white text-slate-800 px-5 py-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 flex items-center justify-between gap-6">
        
        {/* Count & Clear */}
        <div className="flex items-center gap-4 border-r border-slate-200 pr-6">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#04147B] flex items-center justify-center text-xs font-bold text-white shadow-sm">
              {selectedCount}
            </span>
            <span className="text-sm font-bold text-slate-600">đã chọn</span>
          </div>
          <button 
            onClick={onClearSelection}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
            title="Bỏ chọn tất cả"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {actions.map((action, idx) => {
            const isDanger = action.variant === 'danger';
            return (
              <button
                key={idx}
                onClick={action.onClick}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold transition-colors ${
                  isDanger 
                    ? 'text-red-600 hover:text-red-700 hover:bg-red-50' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <action.icon className="w-4 h-4" />
                {action.label}
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
};
