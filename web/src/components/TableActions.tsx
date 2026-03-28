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
    <div className="flex flex-wrap items-center justify-between gap-4 mt-8 mb-4">
      <div className="flex flex-wrap items-center gap-3">
        {showExport && (
          <button
            onClick={onExport}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-[12px] text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-400" />
            Xuất Excel
          </button>
        )}
        {showFilter && (
          <button
            onClick={onFilter}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-[12px] text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Filter className="w-4 h-4 text-slate-400" />
            Bộ lọc
          </button>
        )}
        <div className="relative md:ml-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full md:w-64 pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-[12px] text-sm focus:outline-none focus:ring-2 focus:ring-[#04147B]/20 focus:border-[#04147B]/50 transition-all font-medium shadow-sm placeholder:text-slate-400"
          />
        </div>
      </div>
      {statusText && (
        <span className="text-[13px] font-bold text-slate-400 tracking-wide">{statusText}</span>
      )}
    </div>
  );
};
