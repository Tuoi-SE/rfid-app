'use client';

import { Search, Filter, Download } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

export interface FilterDefinition {
  key: string;
  label: string;
  options: { value: string; label: string; }[];
  value: string;
  onChange: (value: string) => void;
}

interface TableActionsProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showFilter?: boolean; // legacy
  onFilter?: () => void; // legacy
  filters?: FilterDefinition[]; // New advanced filters
  showExport?: boolean;
  onExport?: () => void;
  statusFilterValue?: string; // legacy
  onStatusFilterChange?: (value: string) => void; // legacy
  statusFilterOptions?: { value: string; label: string; }[]; // legacy
  statusText?: string | React.ReactNode;
  rightContent?: React.ReactNode;
}

export const TableActions = ({
  searchPlaceholder = 'Tìm kiếm...',
  searchValue = '',
  onSearchChange,
  showFilter = true,
  onFilter,
  filters,
  showExport = true,
  onExport,
  statusFilterValue,
  onStatusFilterChange,
  statusFilterOptions,
  statusText,
  rightContent
}: TableActionsProps) => {
  const searchParams = useSearchParams();
  const lastAppliedSearchRef = useRef<string | null>(null);

  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (!urlSearch) {
      lastAppliedSearchRef.current = null;
      return;
    }

    if (onSearchChange && urlSearch !== searchValue && lastAppliedSearchRef.current !== urlSearch) {
      onSearchChange(urlSearch);
      lastAppliedSearchRef.current = urlSearch;
    }
  }, [searchParams, searchValue, onSearchChange]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mt-5 mb-3">
      <div className="flex flex-wrap items-center gap-2">
        {showExport && onExport && (
          <button
            onClick={onExport}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-[10px] text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            Xuất Excel
          </button>
        )}

        {/* Legacy single button */}
        {showFilter && onFilter && !filters && (
          <button
            onClick={onFilter}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-[10px] text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            Bộ lọc
          </button>
        )}

        {/* Legacy single status filter dropdown */}
        {statusFilterOptions && statusFilterOptions.length > 0 && onStatusFilterChange && (
          <select
            value={statusFilterValue}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-[10px] text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm outline-none cursor-pointer appearance-none pr-8 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-position-[calc(100%-8px)_center] min-w-[120px]"
          >
            {statusFilterOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}

        {/* New Advanced Filters Arrays */}
        {filters && filters.map(f => (
          <select
            key={f.key}
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-[10px] text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm outline-none cursor-pointer appearance-none pr-8 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-position-[calc(100%-8px)_center] min-w-[140px]"
          >
            <option value="">{f.label}</option>
            {f.options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ))}

        {onSearchChange && (
          <div className="relative md:ml-2 grow sm:grow-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full sm:w-56 pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-[10px] text-xs focus:outline-none focus:ring-2 focus:ring-[#04147B]/20 focus:border-[#04147B]/50 transition-all font-medium shadow-sm placeholder:text-slate-400"
            />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {rightContent}
        {statusText && !rightContent && (
          <span className="text-[11px] font-bold text-slate-400 tracking-wide">{statusText}</span>
        )}
      </div>
    </div>
  );
};
