'use client';
import { useState } from 'react';
import { Users, Plus, Search, Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useUsers } from '../hooks/use-users';
import { useUserMutations } from '../hooks/use-user-mutations';
import { UsersTable } from './users-table';
import { UserFormDialog } from './user-form-dialog';
import { DeleteUserDialog } from './delete-user-dialog';
import { User } from '../types';

export function UsersPageClient() {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useUsers(search);
  const users: User[] = (data as any)?.data ?? data ?? [];

  const { createMutation, updateMutation, deleteMutation } = useUserMutations();

  const openCreate = () => {
    setEditItem(null);
    setShowForm(true);
  };

  const openEdit = (u: User) => {
    setEditItem(u);
    setShowForm(true);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const formError = (createMutation.error || updateMutation.error)?.message;

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

      {isLoading ? (
        <div className="text-center py-16 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-100">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Chưa có người dùng nào</p>
          <button onClick={openCreate} className="text-indigo-600 text-sm mt-2 hover:underline">Tạo người dùng đầu tiên</button>
        </div>
      ) : (
        <UsersTable 
          users={users} 
          currentUserId={currentUser?.id} 
          onEdit={openEdit} 
          onDelete={setDeleteId} 
        />
      )}

      <UserFormDialog
        editItem={editItem}
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={(formData) => {
          if (editItem) {
            updateMutation.mutate({ id: editItem.id, data: formData }, { onSuccess: () => setShowForm(false) });
          } else {
            createMutation.mutate(formData, { onSuccess: () => setShowForm(false) });
          }
        }}
        isSaving={isSaving}
        error={formError}
      />

      <DeleteUserDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
          }
        }}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
