'use client';
import { useState } from 'react';
import { Users, Plus, Search, Loader2, ShieldAlert, ShieldCheck, FileCheck2, Filter, Radio } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useUsers } from '../hooks/use-users';
import { useUserMutations } from '../hooks/use-user-mutations';
import { UsersTable } from './users-table';
import { UserFormDialog } from './user-form-dialog';
import { DeleteUserDialog } from './delete-user-dialog';
import { User } from '../types';
import { PageHeader } from '@/components/PageHeader';
import { TableActions } from '@/components/TableActions';
import { BulkActionsBar, type BulkAction } from '@/components/BulkActionsBar';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useUsersTableLogic } from '../hooks/use-users-table-logic';
import { Trash2 } from 'lucide-react';

export const UsersPageClient = () => {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useUsers({ search, page, limit });
  const responseData = (data as Record<string, unknown>)?.data ?? data;
  const users: User[] = Array.isArray(responseData) ? responseData : ((responseData as Record<string, unknown>)?.items as User[] || []);
  const pagination = (responseData as Record<string, unknown>)?.pagination as { page: number, total_pages: number, total: number, limit: number } | undefined;

  const { createMutation, updateMutation, deleteMutation } = useUserMutations();
  
  const { state, actions } = useUsersTableLogic(users, { createMutation, updateMutation, deleteMutation });

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

const bulkActions: BulkAction[] = [
  {
    label: 'Xoá đã chọn',
    icon: Trash2,
    variant: 'danger',
    onClick: () => actions.setShowBulkDeleteConfirm(true)
  }
];

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
<div className="flex flex-col h-full bg-[#F4F7FB] min-h-screen -m-4 p-4 md:-m-6 md:p-6 lg:-m-8 lg:p-8 relative font-sans pb-28">
  <PageHeader 
    title="Quản lý thành viên"
    description="Quản lý quyền truy cập và phân quyền hệ thống RFID Pro."
    actions={
      <button
        onClick={openCreate}
        className="flex items-center gap-2 bg-[#04147B] hover:bg-[#04147B]/90 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md group"
      >
        <Plus className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" />
        Thêm Thành Viên
      </button>
    }
  />

  {/* 4 Stat Cards */}
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 mt-2">
    {/* Card 1 */}
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between h-[120px]">
      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">TỔNG THÀNH VIÊN</div>
      <div className="flex items-baseline gap-2 mt-auto">
        <span className="text-[36px] font-bold text-[#04147B] leading-none">{users.length}</span>
        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded tracking-wide">+3%~</span>
      </div>
    </div>

    {/* Card 2 */}
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between h-[120px]">
      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ĐANG HOẠT ĐỘNG</div>
      <div className="flex items-baseline gap-2 mt-auto">
        <span className="text-[36px] font-bold text-[#04147B] leading-none">38</span>
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mb-1"></span>
      </div>
    </div>

    {/* Card 3 */}
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between h-[120px]">
      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">PHIÊN QUÉT RFID</div>
      <div className="flex items-baseline gap-2 mt-auto">
        <span className="text-[36px] font-bold text-[#04147B] leading-none">1.2k</span>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">HÔM NAY</span>
      </div>
    </div>

    {/* Card 4 - Security */}
    <div className="bg-[#04147B] rounded-2xl p-6 shadow-md flex flex-col justify-between text-white relative overflow-hidden h-[120px]">
      {/* Decorative blurred circle */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
      
      <div className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider relative z-10">BẢO MẬT HỆ THỐNG</div>
      <div className="flex items-center gap-2.5 mt-auto relative z-10">
        <ShieldCheck className="w-7 h-7 text-white" strokeWidth={1.5} />
        <span className="text-xl font-bold tracking-wide">AN TOÀN</span>
      </div>
    </div>
  </div>

  {/* Table Actions & Filters */}
  <TableActions
    searchPlaceholder="Tìm kiếm thành viên..."
    searchValue={search}
    onSearchChange={(val) => {
      setSearch(val);
      setPage(1);
    }}
    statusText={`Hiển thị ${users.length} người dùng`}
  />

  {/* Table Content */}
  {isLoading ? (
    <div className="text-center py-16 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
  ) : state.sortedItems.length === 0 ? (
    <div className="text-center py-16 bg-white rounded-[20px] border border-slate-100 shadow-sm mt-4">
      <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <p className="text-slate-500 font-medium">Chưa có người dùng nào</p>
    </div>
  ) : (
    <UsersTable 
      users={state.sortedItems} 
      currentUserId={currentUser?.id} 
      selectedIds={state.selectedIds}
      onToggleSelect={actions.handleToggleSelect}
      onSelectAll={actions.handleSelectAll}
      sortConfig={state.sortConfig}
      onSort={actions.handleSort}
      onEdit={openEdit} 
      onDelete={setDeleteId} 
      currentPage={pagination?.page || 1}
      totalPages={pagination?.total_pages || 1}
      totalItems={pagination?.total || users.length}
      pageSize={pagination?.limit || limit}
      onPageChange={setPage}
    />
  )}

  {/* Bottom Alert/Banner */}
  <div className="bg-white rounded-[20px] shadow-sm p-6 relative overflow-hidden flex items-center justify-between">
    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#04147B]"></div>
    <div className="flex items-center gap-6 ml-4">
      <div className="w-12 h-12 bg-[#EEF2FF] text-[#04147B] rounded-2xl flex items-center justify-center shrink-0">
        <FileCheck2 className="w-6 h-6 stroke-[1.5]" />
      </div>
      <div>
        <h4 className="font-bold text-[#04147B] text-[15px] mb-1">Nhật ký bảo mật</h4>
        <p className="text-sm text-slate-500">Mọi thao tác thêm, sửa, xóa thành viên đều được ghi lại trong hệ thống Logs để đảm bảo tính minh bạch. Hệ thống RFID sẽ tự động đồng bộ mã nhân viên sau 5 giây cập nhật.</p>
      </div>
    </div>
    <button className="flex items-center gap-2 text-[#04147B] font-bold text-sm hover:underline pr-4 shrink-0 transition-opacity hover:opacity-80">
      Xem chi tiết Logs
      <span className="text-lg leading-none mb-0.5">→</span>
    </button>
  </div>

  {/* Floating Action Button */}
  <button className="fixed bottom-8 right-8 w-14 h-14 bg-[#04147B] hover:bg-[#04147B]/90 text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(4,20,123,0.3)] transition-transform hover:scale-105 z-50">
    <Radio className="w-6 h-6" />
  </button>

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

  <ConfirmDialog
    isOpen={state.showBulkDeleteConfirm}
    title="Xác nhận xoá nhiều"
    description={`Bạn có chắc chắn muốn xoá ${state.selectedIds.length} thành viên đã chọn? Hành động này không thể hoàn tác.`}
    confirmText={`Xoá ${state.selectedIds.length} thành viên`}
    cancelText="Huỷ bỏ"
    variant="danger"
    isLoading={state.isDeleting}
    onClose={() => actions.setShowBulkDeleteConfirm(false)}
    onConfirm={actions.handleConfirmBulkDelete}
  />

  <BulkActionsBar
    selectedCount={state.selectedIds.length}
    onClearSelection={actions.clearSelection}
    actions={bulkActions}
  />
</div>
);
};
