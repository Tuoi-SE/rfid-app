'use client';
import { useState, useMemo } from 'react';
import { Users, Plus, Loader2, ShieldAlert, ShieldCheck, Search, Filter, Trash2, RotateCcw } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useUsers } from '../hooks/use-users';
import { useUserMutations } from '../hooks/use-user-mutations';
import { useDashboardStats } from '../hooks/use-dashboard-stats';
import { UsersTable } from './users-table';
import { UserFormDialog } from './user-form-dialog';
import { User } from '../types';
import { PageHeader } from '@/components/PageHeader';
import { TableActions } from '@/components/TableActions';
import { BulkActionsBar, type BulkAction } from '@/components/BulkActionsBar';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useUsersTableLogic } from '../hooks/use-users-table-logic';

export const UsersPageClient = () => {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deleted'>('active');
  const [roleFilter, setRoleFilter] = useState('');

  const { data, isLoading } = useUsers({
    search,
    page,
    limit,
    include_deleted: statusFilter === 'all',
    only_deleted: statusFilter === 'deleted'
  });
  const responseData = (data as Record<string, unknown>)?.data ?? data;
  const users: User[] = Array.isArray(responseData) ? responseData : ((responseData as Record<string, unknown>)?.items as User[] || []);
  const pagination = (responseData as Record<string, unknown>)?.pagination as { page: number, total_pages: number, total: number, limit: number } | undefined;

  const { createMutation, updateMutation, deleteMutation, restoreMutation } = useUserMutations();

  const { state, actions } = useUsersTableLogic(users, { createMutation, updateMutation, deleteMutation, restoreMutation });

  const { data: statsRes, isLoading: statsLoading } = useDashboardStats();
  const stats = statsRes?.data;

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

  const displayItems = useMemo(() => {
    let result = state.sortedItems;
    if (roleFilter) result = result.filter(u => u.role === roleFilter);
    return result;
  }, [state.sortedItems, roleFilter]);

  const exportExcel = () => {
    const exportData = displayItems.map((u: any) => ({
      'Tài Khoản': u.username,
      'Email': u.email || '',
      'Vai Trò': u.role === 'ADMIN' ? 'Quản Trị' : u.role === 'WAREHOUSE_MANAGER' ? 'Quản Lý Kho' : 'Nhân Viên',
      'Đại Lý': u.agency ? u.agency.name : 'Văn phòng chính',
      'Trạng Thái': u.deletedAt ? 'Vô hiệu hoá' : 'Hoạt động',
      'Ngày Tạo': u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : ''
    }));
    import('@/utils/export-excel').then(mod => {
      mod.exportToExcel(exportData, 'Danh_Sach_Thanh_Vien');
    });
  };

  const bulkActions: BulkAction[] = [];

  if (statusFilter !== 'deleted') {
    bulkActions.push({
        label: 'Vô hiệu hoá đã chọn',
        icon: Trash2,
        variant: 'danger',
        onClick: () => actions.setShowBulkDeleteConfirm(true)
    });
  }

  if (statusFilter === 'deleted' || statusFilter === 'all') {
    bulkActions.push({
        label: 'Khôi phục đã chọn',
        icon: RotateCcw,
        variant: 'primary',
        onClick: () => actions.setShowBulkRestoreConfirm(true)
    });
  }

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
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between h-[120px] relative overflow-hidden group">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider relative z-10">TỔNG THÀNH VIÊN</div>
          <div className="flex items-baseline gap-2 mt-auto relative z-10">
            <span className="text-[36px] font-bold text-[#04147B] leading-none">
              {statsLoading ? <Loader2 className="w-6 h-6 animate-spin text-slate-300" /> : stats?.totalUsers || 0}
            </span>
          </div>
          {/* Subtle decoration */}
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between h-[120px] relative overflow-hidden group">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider relative z-10">ĐANG HOẠT ĐỘNG</div>
          <div className="flex items-baseline gap-2 mt-auto relative z-10">
            <span className="text-[36px] font-bold text-[#04147B] leading-none">
              {statsLoading ? <Loader2 className="w-6 h-6 animate-spin text-slate-300" /> : stats?.activeUsers || 0}
            </span>
            <span className="relative flex h-2.5 w-2.5 mb-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-emerald-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between h-[120px] relative overflow-hidden group">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider relative z-10">PHIÊN QUÉT RFID</div>
          <div className="flex items-baseline gap-2 mt-auto relative z-10">
            <span className="text-[36px] font-bold text-[#04147B] leading-none">
              {statsLoading ? <Loader2 className="w-6 h-6 animate-spin text-slate-300" /> : stats?.totalScansToday || 0}
            </span>
            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded tracking-wider mb-1">HÔM NAY</span>
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-indigo-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
        </div>

        {/* Card 4 - Security */}
        <div className={`rounded-2xl p-6 shadow-md flex flex-col justify-between text-white relative overflow-hidden h-[120px] ${stats?.securityStatus === 'WARNING' ? 'bg-orange-500' : 'bg-[#04147B]'}`}>
          {/* Decorative blurred circle */}
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -mr-10 -mt-10 ${stats?.securityStatus === 'WARNING' ? 'bg-red-500' : 'bg-indigo-500'}`}></div>

          <div className={`text-[11px] font-bold uppercase tracking-wider relative z-10 ${stats?.securityStatus === 'WARNING' ? 'text-orange-100' : 'text-indigo-200'}`}>BẢO MẬT HỆ THỐNG</div>
          <div className="flex items-center gap-2.5 mt-auto relative z-10">
            {stats?.securityStatus === 'WARNING' ? (
              <ShieldAlert className="w-7 h-7 text-white" strokeWidth={1.5} />
            ) : (
              <ShieldCheck className="w-7 h-7 text-white" strokeWidth={1.5} />
            )}
            <span className="text-xl font-bold tracking-wide">
              {statsLoading ? '...' : (stats?.securityStatus === 'WARNING' ? 'CẢNH BÁO' : 'AN TOÀN')}
            </span>
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
        showExport={true}
        onExport={exportExcel}
        statusText={`Hiển thị ${displayItems.length} người dùng`}
        statusFilterValue={statusFilter}
        onStatusFilterChange={(val) => {
          setStatusFilter(val as 'all' | 'active' | 'deleted');
          setPage(1);
        }}
        statusFilterOptions={[
          { value: 'active', label: 'Đang hoạt động' },
          { value: 'all', label: 'Tất cả (Bao gồm đã xoá)' },
          { value: 'deleted', label: 'Đã vô hiệu hoá (Xoá mềm)' },
        ]}
        filters={[
          {
            key: 'role',
            label: 'Tất cả phân quyền',
            value: roleFilter,
            onChange: setRoleFilter,
            options: [
              { label: 'Quản trị viên (ADMIN)', value: 'ADMIN' },
              { label: 'Quản lý kho', value: 'WAREHOUSE_MANAGER' },
              { label: 'Nhân viên xưởng', value: 'WORKSHOP_STAFF' },
              { label: 'Nhân viên', value: 'STAFF' }
            ]
          }
        ]}
      />

      {/* Table Content */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : displayItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-[20px] border border-slate-100 shadow-sm mt-4">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Chưa có người dùng nào</p>
        </div>
      ) : (
        <UsersTable
          users={displayItems}
          currentUserId={currentUser?.id}
          selectedIds={state.selectedIds}
          onToggleSelect={actions.handleToggleSelect}
          onSelectAll={actions.handleSelectAll}
          sortConfig={state.sortConfig}
          onSort={actions.handleSort}
          onEdit={openEdit}
          onDelete={setDeleteId}
          onRestore={setRestoreId}
          currentPage={pagination?.page || 1}
          totalPages={pagination?.total_pages || 1}
          totalItems={pagination?.total || users.length}
          pageSize={pagination?.limit || limit}
          onPageChange={setPage}
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

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Xác nhận vô hiệu hoá"
        description="Bạn có chắc chắn muốn vô hiệu hoá tài khoản này? Người dùng sẽ không thể đăng nhập vào hệ thống, nhưng vẫn có thể khôi phục lại sau."
        confirmText="Vô hiệu hoá"
        cancelText="Huỷ bỏ"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
          }
        }}
      />

      <ConfirmDialog
        isOpen={!!restoreId}
        title="Xác nhận khôi phục"
        description="Bạn có chắc chắn muốn khôi phục tài khoản này? Người dùng sẽ lại có thể đăng nhập bình thường."
        confirmText="Khôi phục"
        cancelText="Huỷ bỏ"
        variant="primary"
        isLoading={restoreMutation.isPending}
        onClose={() => setRestoreId(null)}
        onConfirm={() => {
          if (restoreId) {
            restoreMutation.mutate(restoreId, { onSuccess: () => setRestoreId(null) });
          }
        }}
      />

      <ConfirmDialog
        isOpen={state.showBulkDeleteConfirm}
        title="Xác nhận vô hiệu hoá nhiều"
        description={`Bạn có chắc chắn muốn vô hiệu hoá ${state.selectedIds.length} thành viên đã chọn? Người dùng sẽ không thể đăng nhập vào hệ thống.`}
        confirmText={`Vô hiệu hoá ${state.selectedIds.length} thành viên`}
        cancelText="Huỷ bỏ"
        variant="danger"
        isLoading={state.isDeleting}
        onClose={() => actions.setShowBulkDeleteConfirm(false)}
        onConfirm={actions.handleConfirmBulkDelete}
      />

      <ConfirmDialog
        isOpen={state.showBulkRestoreConfirm}
        title="Xác nhận khôi phục nhiều"
        description={`Bạn có chắc chắn muốn khôi phục ${state.selectedIds.length} thành viên đã chọn? Người dùng sẽ có thể đăng nhập lại vào hệ thống bình thường.`}
        confirmText={`Khôi phục ${state.selectedIds.length} thành viên`}
        cancelText="Huỷ bỏ"
        variant="primary"
        isLoading={state.isRestoring}
        onClose={() => actions.setShowBulkRestoreConfirm(false)}
        onConfirm={actions.handleConfirmBulkRestore}
      />

      <BulkActionsBar
        selectedCount={state.selectedIds.length}
        onClearSelection={actions.clearSelection}
        actions={bulkActions}
      />
    </div>
  );
};
