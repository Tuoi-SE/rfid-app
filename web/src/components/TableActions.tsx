import { Search, Filter, Download } from 'lucide-react';

interface TableActionsProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  showFilter?: boolean;
  onFilter?: () => void;
  showExport?: boolean;
  onExport?: () => void;
  statusText?: string | React.ReactNode;
}

export const TableActions = ({
  searchPlaceholder = 'Tìm kiếm...',
  searchValue,
  onSearchChange,
  showFilter = true,
  onFilter,
  showExport = true,
  onExport,
  statusText,
}: TableActionsProps) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mt-5 mb-3">
      <div className="flex flex-wrap items-center gap-2">
        {showExport && (
          <button
            onClick={onExport}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-[10px] text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            Xuất Excel
          </button>
        )}
        {showFilter && (
          <button
            onClick={onFilter}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-[10px] text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            Bộ lọc
          </button>
        )}
        <div className="relative md:ml-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full md:w-56 pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-[10px] text-xs focus:outline-none focus:ring-2 focus:ring-[#04147B]/20 focus:border-[#04147B]/50 transition-all font-medium shadow-sm placeholder:text-slate-400"
          />
        </div>
      </div>
      {statusText && (
        <span className="text-[11px] font-bold text-slate-400 tracking-wide">{statusText}</span>
      )}
    </div>
  );
};
