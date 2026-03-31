'use client';
import { useState, useEffect } from 'react';
import { Plus, Loader2, Filter, Trash2 } from 'lucide-react';
import { useProducts } from '../hooks/use-products';
import { useProductMutations } from '../hooks/use-product-mutations';
import { useProductsTableLogic } from '../hooks/use-products-table-logic';
import { ProductsTable } from './products-table';
import { TableActions } from '@/components/TableActions';
import { PageHeader } from '@/components/PageHeader';
import { ProductsStatCards } from './products-stat-cards';
import { ProductFormDialog } from './product-form-dialog';
import { Product } from '../types';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { BulkActionsBar, type BulkAction } from '@/components/BulkActionsBar';
import { useCategories } from '@/features/categories/hooks/use-categories';
import { useAuth } from '@/providers/AuthProvider';

export const ProductsMain = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [search, setSearch] = useState('');

  const { data, isLoading } = useProducts(search ? `search=${search}&limit=1000` : 'limit=1000');

  const { data: categories = [] } = useCategories('');

  const responseData = (data as Record<string, unknown>)?.data ?? data;
  const products: Product[] = Array.isArray(responseData) ? responseData : ((responseData as Record<string, unknown>)?.items as Product[] || []);

  const mutations = useProductMutations();
  const { state, actions } = useProductsTableLogic(products, mutations);

  const bulkActions: BulkAction[] = [
    {
      label: 'Xoá đã chọn',
      icon: Trash2,
      variant: 'danger',
      onClick: () => actions.setShowBulkDeleteConfirm(true)
    }
  ];

  return (
    <div className="flex flex-col h-full bg-[#F4F7FB] flex-1 min-h-[700px] 2xl:min-h-0 -m-4 p-4 md:-m-5 md:p-5 lg:-m-6 lg:p-6 relative font-sans">
      <PageHeader
        title="Quản lý sản phẩm"
        description="Quản lý và theo dõi thông tin chi tiết của tất cả sản phẩm, hàng hoá được gắn thẻ RFID."
        actions={
          isAdmin ? (
            <button
              onClick={actions.openCreate}
              className="flex items-center gap-2 bg-[#04147B] hover:bg-[#04147B]/90 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md group border border-[#04147B]"
            >
              <Plus className="w-4 h-4" />
              Thêm Sản Phẩm
            </button>
          ) : undefined
        }
      />

      <ProductsStatCards totalProducts={products.length} />

      <TableActions
        searchPlaceholder="Tìm kiếm tên sản phẩm hoặc SKU..."
        searchValue={search}
        onSearchChange={setSearch}
        statusText={`Hiển thị ${state.sortedItems.length} / ${state.totalItems} kết quả`}
      />

      {isLoading ? (
        <div className="text-center py-16 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : state.sortedItems.length === 0 && products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed shadow-sm">
          <div className="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-full mx-auto mb-4">
            <Filter className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium">Không tìm thấy sản phẩm nào</p>
        </div>
      ) : (
        <ProductsTable
          products={state.sortedItems}
          selectedIds={state.selectedIds}
          onToggleSelect={actions.handleToggleSelect}
          onSelectAll={actions.handleSelectAll}
          onEdit={actions.openEdit}
          onDelete={actions.setDeleteId}
          currentPage={state.currentPage}
          totalPages={state.totalPages}
          totalItems={state.totalItems}
          pageSize={state.pageSize}
          onPageChange={actions.setCurrentPage}
          sortConfig={state.sortConfig}
          onSort={actions.handleSort}
        />
      )}

      <ProductFormDialog
        editItem={state.editItem}
        isOpen={state.showForm}
        onClose={() => actions.setShowForm(false)}
        onSubmit={(formData) => {
          if (state.editItem) {
            mutations.updateMutation.mutate({ id: state.editItem.id, data: formData }, { onSuccess: () => actions.setShowForm(false) });
          } else {
            mutations.createMutation.mutate(formData, { onSuccess: () => actions.setShowForm(false) });
          }
        }}
        isSaving={state.isSaving}
        error={state.formError}
        categories={categories}
      />

      <ConfirmDialog
        isOpen={!!state.deleteId}
        title="Xác nhận xoá"
        description="Bạn có chắc chắn muốn xoá sản phẩm này? Hành động này không thể hoàn tác."
        confirmText="Xoá Sản Phẩm"
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
        description={`Bạn có chắc chắn muốn xoá ${state.selectedIds.length} sản phẩm đã chọn? Hành động này không thể hoàn tác.`}
        confirmText={`Xoá ${state.selectedIds.length} sản phẩm`}
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
