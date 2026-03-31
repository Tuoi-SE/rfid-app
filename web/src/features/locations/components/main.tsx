'use client';

import React, { useState } from 'react';
import { SignalHigh, Plus, Loader2, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { TableActions } from '@/components/TableActions';
import { useLocations } from '../hooks/use-locations';
import { useLocationMutations } from '../hooks/use-location-mutations';
import { LocationStatCards } from './location-stat-cards';
import { LocationTable } from './location-table';
import { LocationFormDialog } from './location-form-dialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { BulkActionsBar, type BulkAction } from '@/components/BulkActionsBar';
import { useLocationsTableLogic } from '../hooks/use-locations-table-logic';
import { useAuth } from '@/providers/AuthProvider';

export const LocationsMain = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [search, setSearch] = useState('');

  // Query with limit=100 to get enough items for the mockup without actual pagination
  const { data, isLoading, error } = useLocations('limit=100');
  
  const locations = data?.data?.items || (data?.data as any) || [];
  const mutations = useLocationMutations();

  const { state, actions } = useLocationsTableLogic(locations, mutations);

  const metrics = {
    factories: locations.filter((l: any) => l.type === 'WORKSHOP').length,
    warehouses: locations.filter((l: any) => l.type === 'WAREHOUSE').length,
    hotels: locations.filter((l: any) => ['HOTEL', 'SPA', 'RESORT'].includes(l.type)).length,
    totalTags: locations.reduce((acc: number, l: any) => acc + (l.tags_count || 0), 0),
  };

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
        title="Quản lý địa điểm"
        description="Theo dõi và quản lý mạng lưới kho xưởng, nhà máy cung ứng."
        actions={
          isAdmin ? (
            <button
              onClick={actions.openCreate}
              className="flex items-center gap-2 bg-[#04147B] hover:bg-[#04147B]/90 text-white px-5 py-3 rounded-xl text-sm font-bold transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              Thêm Địa Điểm
            </button>
          ) : undefined
        }
      />

      {/* Layer 1: Stats */}
      <LocationStatCards metrics={metrics} />

      {/* Table Actions & Filters */}
      <TableActions
        searchPlaceholder="Tìm địa điểm..."
        searchValue={search}
        onSearchChange={setSearch}
        statusText={`Hiển thị ${locations.length} kết quả`}
      />

      {isLoading ? (
        <div className="text-center py-16 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 font-medium text-center shadow-sm">
          Lỗi khi tải dữ liệu địa điểm. Vui lòng thử lại.
        </div>
      ) : state.sortedItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed shadow-sm">
          <SignalHigh className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Không tìm thấy địa điểm</p>
        </div>
      ) : (
        <LocationTable 
          locations={state.sortedItems}
          selectedIds={state.selectedIds}
          onToggleSelect={actions.handleToggleSelect}
          onSelectAll={actions.handleSelectAll}
          onEdit={actions.openEdit}
          onDelete={actions.setDeleteId}
          isAdmin={isAdmin}
        />
      )}

      {/* Form Dialog */}
      <LocationFormDialog
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

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!state.deleteId}
        title="Xác nhận xoá"
        description="Bạn có chắc chắn muốn xoá địa điểm này? Hành động này không thể hoàn tác."
        confirmText="Xoá Địa Điểm"
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
        description={`Bạn có chắc chắn muốn xoá ${state.selectedIds.length} địa điểm đã chọn? Hành động này không thể hoàn tác.`}
        confirmText={`Xoá ${state.selectedIds.length} địa điểm`}
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
