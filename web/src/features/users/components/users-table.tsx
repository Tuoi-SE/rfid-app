import { Pencil, Trash2 } from 'lucide-react';
import { User } from '../types';
import { Pagination } from '@/components/Pagination';

interface UsersTableProps {
  users: User[];
  currentUserId?: string;
  onEdit: (u: User) => void;
  onDelete: (id: string) => void;
  
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
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange = () => {}
}: UsersTableProps) {
  if (users.length === 0) return null;

  return (
    <div className="w-full">
      <table className="w-full text-sm shrink-0">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left py-4 font-bold text-[10px] uppercase tracking-wider text-slate-400 w-[25%]">Người dùng</th>
            <th className="text-left py-4 font-bold text-[10px] uppercase tracking-wider text-slate-400">Vai trò</th>
            <th className="text-left py-4 font-bold text-[10px] uppercase tracking-wider text-slate-400">Trực thuộc</th>
            <th className="text-left py-4 font-bold text-[10px] uppercase tracking-wider text-slate-400">Ngày tạo</th>
            <th className="text-left py-4 font-bold text-[10px] uppercase tracking-wider text-slate-400">Trạng thái</th>
            <th className="text-right py-4 font-bold text-[10px] uppercase tracking-wider text-slate-400">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
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
              <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="py-4 text-left">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm uppercase shrink-0 ${isDisabled ? 'bg-slate-100 text-slate-400' : 'bg-[#F4F7FB] text-[#04147B]'}`}>
                      {u.username.substring(0, 2)}
                    </div>
                    <div className="flex flex-col">
                      <span className={`font-bold text-[13px] ${isDisabled ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {u.username}
                      </span>
                      <span className={`text-[12px] font-medium mt-0.5 ${isDisabled ? 'text-slate-400' : 'text-slate-500'}`}>
                        {u.email || (isDisabled ? 'Disabled account' : '—')}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="py-4 text-left">
                  <span className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-full ${getRoleBadge(roleDisplay)} ${isDisabled ? 'opacity-50 grayscale' : ''}`}>
                    {roleDisplay}
                  </span>
                </td>
                <td className="py-4 text-left">
                  <div className="flex flex-col">
                    <span className="font-bold text-[13px] text-slate-700">{u.location?.name || '—'}</span>
                    <span className="text-[11px] font-medium text-slate-400 mt-0.5">{u.location?.code || ''}</span>
                  </div>
                </td>
                <td className="py-4 text-left">
                  <span className="text-[13px] font-medium text-slate-500">
                    {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </td>
                <td className="py-4 text-left">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${isDisabled ? 'bg-slate-300' : 'bg-emerald-500'}`}></span>
                    <span className={`text-[12px] font-bold ${isDisabled ? 'text-slate-400' : 'text-emerald-600'}`}>
                      {isDisabled ? 'Disabled' : 'Active'}
                    </span>
                  </div>
                </td>
                <td className="py-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(u)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-indigo-600" title="Sửa">
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
