'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Users, Plus, Pencil, Trash2, Search, X, Loader2, User as UserIcon, Shield, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';

interface User {
  id: string;
  username: string;
  email: string | null;
  role: 'ADMIN' | 'STAFF';
  createdAt: string;
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<User | null>(null);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'STAFF' });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users', search],
    queryFn: () => api.getUsers(search ? `search=${search}` : ''),
  });

  const users: User[] = data?.data ?? data ?? [];

  const createMutation = useMutation({
    mutationFn: (d: any) => api.createUser(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); closeForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: d }: any) => api.updateUser(id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); closeForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteUser(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); setDeleteId(null); },
  });

  const openCreate = () => {
    setEditItem(null);
    setFormData({ username: '', email: '', password: '', role: 'STAFF' });
    setShowForm(true);
  };

  const openEdit = (u: User) => {
    setEditItem(u);
    setFormData({ username: u.username, email: u.email || '', password: '', role: u.role });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };
    if (editItem) {
      if (!payload.password) delete (payload as any).password; // Don't send empty password
      updateMutation.mutate({ id: editItem.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Protect page content if not admin (double check, backend also protects)
  if (currentUser && currentUser.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <ShieldAlert className="w-16 h-16 text-red-100 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Không có quyền truy cập</h2>
        <p className="mt-2 text-sm">Chỉ Quản trị viên (ADMIN) mới có quyền quản lý người dùng.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-500" />
            Người dùng
          </h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý tài khoản và phân quyền truy cập hệ thống</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Thêm người dùng
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm theo tên đăng nhập hoặc email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all bg-white"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-100">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Chưa có người dùng nào</p>
          <button onClick={openCreate} className="text-indigo-600 text-sm mt-2 hover:underline">Tạo người dùng đầu tiên</button>
        </div>
      ) : (
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
                      <button onClick={() => openEdit(u)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-indigo-600" title="Sửa">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setDeleteId(u.id)} 
                        disabled={currentUser?.id === u.id}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent" 
                        title={currentUser?.id === u.id ? "Không thể tự xoá chính mình" : "Xoá"}
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
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={closeForm}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-slate-800">
                {editItem ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}
              </h2>
              <button onClick={closeForm} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tên đăng nhập *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu {editItem && '(Bỏ trống nếu không đổi)'}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required={!editItem}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Vai trò *</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white"
                >
                  <option value="STAFF">Nhân viên (STAFF)</option>
                  <option value="ADMIN">Quản trị (ADMIN)</option>
                </select>
              </div>
              {(createMutation.isError || updateMutation.isError) && (
                <p className="text-red-500 text-sm">Lỗi: {(createMutation.error || updateMutation.error)?.message}</p>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  Huỷ
                </button>
                <button type="submit" disabled={isSaving} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editItem ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Xác nhận xoá</h2>
            <p className="text-slate-500 text-sm mb-5">Bạn có chắc muốn xoá người dùng này? Thao tác không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Huỷ</button>
              <button
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Xoá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
