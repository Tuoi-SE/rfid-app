'use client';
import { useState, useMemo } from 'react';
import { FolderTree, Plus, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { TableActions } from '@/components/TableActions';
import { useCategories } from '../hooks/use-categories';
import { useCategoryMutations } from '../hooks/use-category-mutations';
import { CategoriesTable } from './categories-table';
import { CategoryFormDialog } from './category-form-dialog';
import { CategoriesStatCards } from './categories-stat-cards';
import { Category } from '../types';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { BulkActionsBar, type BulkAction } from '@/components/BulkActionsBar';
import { useCategoriesTableLogic } from '../hooks/use-categories-table-logic';
import { Trash2 } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { hasAdminAccess } from '@/utils/role-helpers';

export const CategoriesMain = () => {
  const { user } = useAuth();
  const isAdmin = hasAdminAccess(user?.role);

  const [search, setSearch] = useState('');

  const { data: categories = [], isLoading } = useCategories(search);
  const mutations = useCategoryMutations();

  const { state, actions } = useCategoriesTableLogic(categories, mutations);

  const bulkActions: BulkAction[] = [
    {
      label: 'Xoá đã chọn',
      icon: Trash2,
      variant: 'danger',
      onClick: () => actions.setShowBulkDeleteConfirm(true)
    }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 flex-1 min-h-[700px] 2xl:min-h-0 -m-4 p-4 md:-m-5 md:p-5 lg:-m-6 lg:p-6 relative">
      <PageHeader
        title="Quản lý danh mục"
        description="Quản lý và tổ chức các nhóm sản phẩm trong hệ thống RFID của Loom & Link Pro."
        actions={
          isAdmin ? (
            <button
              onClick={actions.openCreate}
              className="flex items-center gap-2 bg-[#04147B] hover:bg-[#04147B]/90 text-white px-5 py-3 rounded-xl text-sm font-bold transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              Thêm Danh Mục
            </button>
          ) : undefined
        }
      />

      {/* Stat Cards Row */}
      <CategoriesStatCards />

      {/* Table Actions & Filters */}
      <TableActions
        searchPlaceholder="Tìm danh mục..."
        searchValue={search}
        onSearchChange={setSearch}
        showExport={true}
        onExport={() => {
          const exportData = state.sortedItems.map((c: any) => ({
            'ID Danh Mục': c.id?.slice(-8).toUpperCase() || '',
            'Tên Danh Mục': c.name,
            'Mô tả': c.description || '',
            'Ngày Tạo': new Date(c.createdAt).toLocaleDateString('vi-VN')
          }));
          import('@/utils/export-excel').then(mod => {
            mod.exportToExcel(exportData, 'Danh_Sach_Danh_Muc');
          });
        }}
        statusText={`Hiển thị ${state.sortedItems.length} / ${state.totalItems} kết quả`}
      />

      {isLoading ? (
        <div className="text-center py-16 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : state.sortedItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed shadow-sm">
          <FolderTree className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Không tìm thấy danh mục</p>
        </div>
      ) : (
        <CategoriesTable
          categories={state.sortedItems}
          selectedIds={state.selectedIds}
          onToggleSelect={actions.handleToggleSelect}
          onSelectAll={actions.handleSelectAll}
          onEdit={actions.openEdit}
          onDelete={actions.setDeleteId}
          sortConfig={state.sortConfig}
          onSort={actions.handleSort}
          currentPage={state.currentPage}
          totalPages={state.totalPages}
          totalItems={state.totalItems}
          pageSize={state.pageSize}
          onPageChange={actions.setCurrentPage}
        />
      )}

      {/* Insights Bottom Section */}
      <CategoryFormDialog
        editItem={state.editItem}
        isOpen={state.showForm}
        onClose={() => actions.setShowForm(false)}
        onSubmit={(formData: any) => {
          if (state.editItem) {
            mutations.updateMutation.mutate({ id: state.editItem.id, data: formData }, { onSuccess: () => actions.setShowForm(false) });
          } else {
            mutations.createMutation.mutate(formData, { onSuccess: () => actions.setShowForm(false) });
          }
        }}
        isSaving={state.isSaving}
        error={state.formError}
      />

      <ConfirmDialog
        isOpen={!!state.deleteId}
        title="Xác nhận xoá"
        description="Bạn có chắc chắn muốn xoá danh mục này? Hành động này không thể hoàn tác."
        confirmText="Xoá Danh Mục"
        cancelText="Huỷ bỏ"
        variant="danger"
        isLoading={state.isDeleting}
        onClose={() => actions.setDeleteId(null)}
        onConfirm={() => {
          if (state.deleteId) {
            mutations.deleteMutation.mutate(state.deleteId, { onSuccess: () => actions.setDeleteId(null) });
          }
        }}
      />

      <ConfirmDialog
        isOpen={state.showBulkDeleteConfirm}
        title="Xác nhận xoá nhiều"
        description={`Bạn có chắc chắn muốn xoá ${state.selectedIds.length} danh mục đã chọn? Hành động này không thể hoàn tác.`}
        confirmText={`Xoá ${state.selectedIds.length} danh mục`}
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
