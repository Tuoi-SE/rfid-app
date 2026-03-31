import React from 'react';
import { LocationData, LocationType } from '../types';
import { Trash2, Pencil } from 'lucide-react';

interface LocationTableProps {
  locations: LocationData[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: (checked: boolean) => void;
  onEdit: (loc: LocationData) => void;
  onDelete: (id: string) => void;
  sortConfig?: any;
  onSort?: (key: keyof LocationData | 'tags_count') => void;
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  isAdmin?: boolean;
}

const getTypeBadge = (type: LocationType) => {
  switch (type) {
    case 'WORKSHOP': return <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700">XƯỞNG MAY</span>;
    case 'WAREHOUSE': return <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600">KHO TỔNG</span>;
    case 'HOTEL': return <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-600">KHÁCH SẠN</span>;
    case 'SPA': return <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-600">SPA</span>;
    case 'CUSTOMER': return <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-600">KHÁCH HÀNG</span>;
    default: return <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500">{type}</span>;
  }
};

export const LocationTable: React.FC<LocationTableProps> = ({ 
  locations,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onEdit,
  onDelete,
  isAdmin = false
}) => {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto bg-white rounded-[20px] border border-slate-100 shadow-sm mb-4 xl:mb-6">
        <table className="w-full text-sm min-w-[820px]">
          <thead className="sticky top-0 z-10 bg-white shadow-sm border-b border-slate-100">
            <tr>
              {isAdmin && (
                <th className="px-5 py-4 w-12 text-center text-slate-300">
                  <input 
                    type="checkbox" 
                    checked={locations.length > 0 && selectedIds.length === locations.length}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-200 text-[#04147B] focus:ring-[#04147B]/20 cursor-pointer"
                  />
                </th>
              )}
              <th className="px-5 py-4 font-black text-[11px] text-slate-500 tracking-widest uppercase">Địa điểm</th>
              <th className="px-5 py-4 font-black text-[11px] text-slate-500 tracking-widest uppercase">Mã Code</th>
              <th className="px-5 py-4 font-black text-[11px] text-slate-500 tracking-widest uppercase">Loại</th>
              <th className="px-5 py-4 font-black text-[11px] text-slate-500 tracking-widest uppercase">Số lượng tags</th>
              {isAdmin && <th className="text-left px-5 py-4 font-black text-[11px] text-slate-500 tracking-widest uppercase">Thao tác</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {locations.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="px-6 py-12 text-center text-slate-400 text-sm">
                  Chưa có địa điểm nào trong hệ thống.
                </td>
              </tr>
            ) : (
              locations.map((loc) => {
                const isSelected = selectedIds.includes(loc.id);
                return (
                  <tr key={loc.id} className={`hover:bg-slate-50/50 transition-colors group ${isSelected ? 'bg-[#04147B]/5' : ''}`}>
                    {isAdmin && (
                      <td className="px-5 py-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => onToggleSelect(loc.id)}
                          className="w-4 h-4 rounded border-slate-200 text-[#04147B] focus:ring-[#04147B]/20 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-800 text-[14px] leading-tight mb-1 flex items-center gap-3">
                        {loc.name}
                      </div>
                      {loc.address && <div className="text-[12px] text-slate-500 mt-0.5 truncate max-w-[260px]">{loc.address}</div>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="inline-block bg-slate-100 text-slate-700 font-mono font-medium text-[11px] px-2.5 py-1 rounded-lg">
                        {loc.code}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {getTypeBadge(loc.type)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-xs font-bold min-w-12">
                        {loc.tags_count?.toLocaleString('vi-VN') || 0}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-4 text-left">
                        <div className="flex items-center justify-start gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onEdit(loc)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-[#04147B]">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => onDelete(loc.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
