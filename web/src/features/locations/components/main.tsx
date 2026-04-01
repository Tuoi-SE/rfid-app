'use client';

import React, { useState } from 'react';
import { SignalHigh, Plus, Loader2, Trash2, RefreshCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { httpClient } from '@/lib/http/client';
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
import { Pagination } from '@/components/Pagination';

export const LocationsMain = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [search, setSearch] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Query with limit=100 to get enough items for the mockup without actual pagination
  const { data, isLoading, error, refetch } = useLocations('limit=100');
  
  const locations = data?.data?.items || (data?.data as any) || [];
  const mutations = useLocationMutations();

  const { state, actions } = useLocationsTableLogic(locations, mutations);

  const metrics = {
    factories: locations.filter((l: any) => l.type === 'WORKSHOP').length,
    warehouses: locations.filter((l: any) => l.type === 'WAREHOUSE').length,
    hotels: locations.filter((l: any) => ['HOTEL', 'SPA', 'RESORT'].includes(l.type)).length,
    totalTags: locations.reduce((acc: number, l: any) => acc + (l.tags_count || 0), 0),
  };

  const handleSyncWarehouses = async () => {
    try {
      setIsSyncing(true);
      const res = await httpClient('/locations/sync-warehouses', { method: 'POST' });
      toast.success(res.message || 'Đồng bộ Kho Xưởng thành công!');
      void refetch();
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra khi đồng bộ.');
    } finally {
      setIsSyncing(false);
    }
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
    <div className="flex flex-col h-full bg-slate-50 flex-1 min-h-[700px] 2xl:min-h-0 -m-4 p-4 pb-28 md:-m-5 md:p-5 md:pb-28 lg:-m-6 lg:p-6 lg:pb-28 relative">
      <PageHeader
        title="Quản lý địa điểm"
        description="Theo dõi và quản lý mạng lưới kho xưởng, nhà máy cung ứng."
        actions={
          isAdmin ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleSyncWarehouses}
                className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-4 py-3 rounded-xl text-sm transition-all"
                disabled={isSyncing}
                title="Tự động khởi tạo Kho Xưởng cho toàn bộ nhà máy còn thiếu & gỡ thẻ kẹt"
              >
                {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                Đồng bộ Kho xưởng
              </button>
              <button
                onClick={actions.openCreate}
                className="flex items-center gap-2 bg-[#04147B] hover:bg-[#04147B]/90 text-white px-5 py-3 rounded-xl text-sm font-bold transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                Thêm Địa Điểm
              </button>
            </div>
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
        showExport={true}
        onExport={() => {
          const exportData = state.sortedItems.map((l: any) => ({
            'ID Địa Điểm': l.id?.slice(-8).toUpperCase() || '',
            'Tên Phân Xưởng/Kho': l.name,
            'Địa Chỉ': l.address || '',
            'Phân Loại': l.type === 'WAREHOUSE' ? 'Kho Trung Tâm' : l.type === 'WORKSHOP' ? 'Phân Xưởng' : 'Nhà Xưởng & Máy Móc',
            'Số Lượng Thẻ RFID': l.tags_count || 0,
            'Tình Trạng': l.status || 'Hoạt Động'
          }));
          import('@/utils/export-excel').then(mod => {
            mod.exportToExcel(exportData, 'Danh_Sach_Dia_Diem');
          });
        }}
        statusText={`Hiển thị ${state.sortedItems.length} kết quả`}
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

      {!isLoading && !error && state.sortedItems.length > 0 && (
        <Pagination
          currentPage={state.currentPage}
          totalPages={state.totalPages}
          totalItems={state.totalItems}
          pageSize={state.pageSize}
          onPageChange={actions.setCurrentPage}
          itemName="địa điểm"
        />
      )}

      {/* Form Dialog */}
      <LocationFormDialog
        editItem={state.editItem}
        isOpen={state.showForm}
        onClose={() => actions.setShowForm(false)}
        onSubmit={(formData: any) => {
          if (state.editItem) {
            const updatePayload = {
              name: formData.name,
              address: formData.address,
            };
            mutations.updateMutation.mutate({ id: state.editItem.id, data: updatePayload }, { onSuccess: () => actions.setShowForm(false) });
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
