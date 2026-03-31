import { Pencil, Trash2, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { User } from '../types';
import { Pagination } from '@/components/Pagination';

interface UsersTableProps {
  users: User[];
  currentUserId?: string;
  onEdit: (u: User) => void;
  onDelete: (id: string) => void;
  
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onSelectAll?: () => void;
  
  sortConfig?: { key: string; direction: 'asc' | 'desc' } | null;
  onSort?: (key: string) => void;
  
  // Pagination props (optional to not break existing usage if not provided)
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

export function UsersTable({ 
  users, 
  currentUserId, 
  onEdit, 
  onDelete,
  selectedIds = [],
  onToggleSelect = () => {},
  onSelectAll = () => {},
  sortConfig,
  onSort,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange = () => {}
}: UsersTableProps) {
  if (users.length === 0) return null;

  const renderSortableHeader = (label: string, sortKey: string, align: 'left' | 'center' | 'right' = 'left', customWidth?: string) => {
    const isActive = sortConfig?.key === sortKey;
    const isSortable = !!onSort;
    return (
      <th 
        className={`px-5 py-4 font-black text-[11px] text-slate-500 tracking-widest uppercase ${isSortable ? 'cursor-pointer hover:bg-slate-50 transition-colors group' : ''} ${customWidth || ''}`}
        onClick={() => isSortable && onSort(sortKey)}
      >
        <div className={`flex items-center gap-1.5 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'}`}>
          <span className={isActive ? 'text-[#04147B]' : ''}>{label}</span>
          {isSortable && (
            isActive ? (
              sortConfig.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-[#04147B]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#04147B]" />
            ) : (
              <ChevronsUpDown className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            )
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto bg-white rounded-[20px] border border-slate-100 shadow-sm mb-4 xl:mb-6">
        <table className="w-full text-sm text-left">
          <thead className="sticky top-0 z-10 bg-white shadow-sm border-b border-slate-100">
            <tr>
              <th className="px-5 py-4 w-12 text-center text-slate-300">
                <input 
                  type="checkbox" 
                  checked={users.length > 0 && selectedIds.length === users.length}
                  onChange={onSelectAll}
                  className="w-4 h-4 rounded border-slate-200 text-[#04147B] focus:ring-[#04147B]/20 cursor-pointer" 
                />
              </th>
              {renderSortableHeader('Người dùng', 'username', 'left', 'w-[25%]')}
              {renderSortableHeader('Vai trò', 'role')}
              {renderSortableHeader('Trực thuộc', 'location')}
              {renderSortableHeader('Ngày tạo', 'createdAt')}
              {renderSortableHeader('Trạng thái', 'status')}
              <th className="px-5 py-4 font-black text-[11px] text-slate-500 tracking-widest uppercase text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
          {users.map((u, i) => {
            const roleDisplay: string = u.role;
            const getRoleBadge = (role: string) => {
              if (role === 'ADMIN') return "bg-[#EEF2FF] text-[#04147B]";
              if (role === 'WAREHOUSE_MANAGER') return "bg-[#FFF8E6] text-[#B07300]";
              return "bg-[#EEF2FF] text-[#2454FF]";
            }
            
            // Check if deactivated or deleted
            const isDisabled = false;

            return (
              <tr key={u.id} className={`hover:bg-slate-50/50 transition-colors group ${selectedIds.includes(u.id) ? 'bg-[#04147B]/5' : ''}`}>
                <td className="px-5 py-4 text-center">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(u.id)}
                    onChange={() => onToggleSelect(u.id)}
                    className="w-4 h-4 rounded border-slate-200 text-[#04147B] focus:ring-[#04147B]/20 cursor-pointer" 
                  />
                </td>
                <td className="px-5 py-4 text-left">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm uppercase shrink-0 ${isDisabled ? 'bg-slate-100 text-slate-400' : 'bg-[#04147B]/5 text-[#04147B]'}`}>
                      {u.username.substring(0, 2)}
                    </div>
                    <div className="flex flex-col">
                      <span className={`font-bold text-[13px] ${isDisabled ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {u.username}
                      </span>
                      <span className={`text-[12px] font-medium mt-0.5 ${isDisabled ? 'text-slate-400' : 'text-slate-500'}`}>
                        {isDisabled ? 'Disabled account' : '—'}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-left">
                  <span className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-full ${getRoleBadge(roleDisplay)} ${isDisabled ? 'opacity-50 grayscale' : ''}`}>
                    {roleDisplay}
                  </span>
                </td>
                <td className="px-5 py-4 text-left">
                  <div className="flex flex-col">
                    <span className="font-bold text-[13px] text-slate-700">{u.location?.name || '—'}</span>
                    <span className="text-[11px] font-medium text-slate-400 mt-0.5">{u.location?.code || ''}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-left">
                  <span className="text-[13px] font-medium text-slate-500">
                    {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </td>
                <td className="px-5 py-4 text-left">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${isDisabled ? 'bg-slate-300' : 'bg-emerald-500'}`}></span>
                    <span className={`text-[12px] font-bold ${isDisabled ? 'text-slate-400' : 'text-emerald-600'}`}>
                      {isDisabled ? 'Disabled' : 'Active'}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(u)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-[#04147B]" title="Sửa">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(u.id)} 
                      disabled={currentUserId === u.id}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent" 
                      title={currentUserId === u.id ? "Không thể tự xoá chính mình" : "Xoá"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      {/* Pagination Container */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={onPageChange}
        itemName="thành viên"
      />
    </div>
  );
}
