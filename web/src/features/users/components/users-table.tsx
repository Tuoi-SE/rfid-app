import { Pencil, Trash2, Shield, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface UsersTableProps {
  users: User[];
  currentUserId?: string;
  onEdit: (u: User) => void;
  onDelete: (id: string) => void;
}

export function UsersTable({ users, currentUserId, onEdit, onDelete }: UsersTableProps) {
  if (users.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            <th className="text-left px-5 py-3 font-medium text-slate-500 w-12"></th>
            <th className="text-left px-5 py-3 font-medium text-slate-500">Tên đăng nhập</th>
            <th className="text-left px-5 py-3 font-medium text-slate-500">Email</th>
            <th className="text-center px-5 py-3 font-medium text-slate-500">Vai trò</th>
            <th className="text-right px-5 py-3 font-medium text-slate-500">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-5 py-3.5">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                  {u.username.substring(0, 2)}
                </div>
              </td>
              <td className="px-5 py-3.5 font-medium text-slate-800">{u.username}</td>
              <td className="px-5 py-3.5 text-slate-500">{u.email || '—'}</td>
              <td className="px-5 py-3.5 text-center">
                {u.role === 'ADMIN' ? (
                  <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide">
                    <Shield className="w-3 h-3" /> ADMIN
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-medium tracking-wide">
                    <UserIcon className="w-3 h-3" /> STAFF
                  </span>
                )}
              </td>
              <td className="px-5 py-3.5 text-right">
                <div className="flex items-center justify-end gap-1">
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
