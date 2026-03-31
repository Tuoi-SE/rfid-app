import React from 'react';
import { LocationData, LocationType } from '../types';
import { MoreVertical, Filter, Download, Trash2, Pencil } from 'lucide-react';

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
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 shrink-0">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50">
              {isAdmin && (
                <th className="px-5 py-4 w-12 text-center border-r border-slate-100">
                  <input 
                    type="checkbox" 
                    checked={locations.length > 0 && selectedIds.length === locations.length}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
              )}
              <th className="px-6 py-4 text-[11px] font-black tracking-widest text-slate-500 uppercase">Địa điểm</th>
              <th className="px-6 py-4 text-[11px] font-black tracking-widest text-slate-500 uppercase">Mã Code</th>
              <th className="px-6 py-4 text-[11px] font-black tracking-widest text-slate-500 uppercase">Loại</th>
              <th className="px-6 py-4 text-[11px] font-black tracking-widest text-slate-500 uppercase">Số lượng tags</th>
              {isAdmin && <th className="px-6 py-4 text-[11px] font-black tracking-widest text-slate-500 uppercase text-right">Thao tác</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
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
                  <tr key={loc.id} className={`hover:bg-slate-50 transition-colors group ${isSelected ? 'bg-indigo-50/30' : ''}`}>
                    {isAdmin && (
                      <td className="px-5 py-4 text-center border-r border-slate-50">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => onToggleSelect(loc.id)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 text-sm flex items-center gap-3">
                        {loc.name}
                      </div>
                      {loc.address && <div className="text-[12px] text-slate-500 mt-0.5 truncate max-w-[250px]">{loc.address}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-block bg-slate-100 text-slate-700 font-mono font-medium text-[11px] px-2.5 py-1 rounded">
                        {loc.code}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getTypeBadge(loc.type)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-700">{loc.tags_count?.toLocaleString('vi-VN') || 0}</div>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onEdit(loc)} className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-indigo-600">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => onDelete(loc.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-500">
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
