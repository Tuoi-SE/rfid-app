'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { TableActions } from '@/components/TableActions';
import { useTransfers } from '../hooks/use-transfers';
import { TransferStatCards } from './transfer-stat-cards';
import { TransferTable } from './transfer-table';
import { TransferDetailsModal } from './transfer-details-modal';
import { useAuth } from '@/providers/AuthProvider';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

export const TransfersMain = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'WAREHOUSE_MANAGER';
  const searchParams = useSearchParams();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedTransferId, setSelectedTransferId] = useState<string | null>(null);

  const { data, isLoading, error } = useTransfers('limit=100');
  
  // The backend wraps data in { success, data: { data: [], total, ... } }
  const responseData = data?.data;
  const transfers = Array.isArray(responseData?.data) 
    ? responseData.data 
    : Array.isArray(responseData) ? responseData : [];

  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch && urlSearch !== searchKeyword) {
      setSearchKeyword(urlSearch);
    }
  }, [searchParams, searchKeyword]);

  const filteredTransfers = useMemo(() => {
    let result = transfers;
    if (filterStatus) result = result.filter((t: any) => t.status === filterStatus);
    if (filterType) result = result.filter((t: any) => t.type === filterType);

    if (searchKeyword.trim()) {
      const normalized = searchKeyword.toLowerCase();
      result = result.filter((transfer: any) =>
        transfer.code?.toLowerCase().includes(normalized) ||
        transfer.type?.toLowerCase().includes(normalized) ||
        transfer.status?.toLowerCase().includes(normalized) ||
        transfer.source?.name?.toLowerCase().includes(normalized) ||
        transfer.destination?.name?.toLowerCase().includes(normalized) ||
        transfer.createdBy?.username?.toLowerCase().includes(normalized),
      );
    }
    return result;
  }, [transfers, searchKeyword, filterStatus, filterType]);

  const exportExcel = () => {
    const exportData = filteredTransfers.map((t: any) => ({
      'Mã Lệnh': t.code,
      'Loại': t.type,
      'Nơi Xuất': t.source?.name,
      'Nơi Nhập': t.destination?.name,
      'Trạng Thái': t.status,
      'Số Lượng EPC': t.items?.length || 0,
      'Người Tạo': t.createdBy?.username || t.createdBy?.email || ''
    }));
    import('@/utils/export-excel').then(mod => {
      mod.exportToExcel(exportData, 'Danh_Sach_Dieu_Chuyen');
    });
  };

  const metrics = {
    pending: filteredTransfers.filter((t: any) => t.status === 'PENDING').length,
    completed: filteredTransfers.filter((t: any) => t.status === 'COMPLETED').length,
    cancelled: filteredTransfers.filter((t: any) => t.status === 'CANCELLED').length,
    totalTagsInTransit: filteredTransfers
      .filter((t: any) => t.status === 'PENDING')
      .reduce((acc: number, t: any) => acc + (t.items?.length || 0), 0),
  };

  return (
    <div className="space-y-4 xl:space-y-6 pb-8">
      <PageHeader
        title="Quản lý Điều chuyển"
        description="Theo dõi và nhận lô thẻ RFID đang luân chuyển giữa các cơ sở theo luồng kiểm đếm."
        actions={
          isManager ? (
            <button 
              className="bg-[#04147B] hover:bg-indigo-800 text-white px-5 py-2.5 rounded-[12px] font-bold text-sm transition-all shadow-[0_4px_12px_rgb(4,20,123,0.2)] hover:shadow-[0_6px_20px_rgb(4,20,123,0.3)] hover:-translate-y-0.5 flex items-center gap-2"
              title="Tạo phiếu điều chuyển"
            >
              <Plus className="w-4 h-4 shrink-0" /> Thêm phiếu mới
            </button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center p-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#04147B]"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl font-medium shadow-sm">
          Lỗi khi kết nối đến luồng điều chuyển. Vui lòng thử lại.
        </div>
      ) : (
        <>
          <TransferStatCards metrics={metrics} />
          <TableActions
            searchValue={searchKeyword}
            onSearchChange={setSearchKeyword}
            searchPlaceholder="Tìm mã lệnh, trạng thái..."
            showExport={true}
            onExport={exportExcel}
            filters={[
              {
                key: 'status',
                label: 'Tất cả trạng thái',
                value: filterStatus,
                onChange: setFilterStatus,
                options: [
                  { label: 'PENDING', value: 'PENDING' },
                  { label: 'COMPLETED', value: 'COMPLETED' },
                  { label: 'CANCELLED', value: 'CANCELLED' }
                ]
              },
              {
                key: 'type',
                label: 'Tất cả loại hình',
                value: filterType,
                onChange: setFilterType,
                options: [
                  { label: 'ADMIN_TO_WORKSHOP', value: 'ADMIN_TO_WORKSHOP' },
                  { label: 'WORKSHOP_TO_ADMIN', value: 'WORKSHOP_TO_ADMIN' },
                  { label: 'WORKSHOP_TO_WORKSHOP', value: 'WORKSHOP_TO_WORKSHOP' }
                ]
              }
            ]}
            statusText={`Hiển thị ${filteredTransfers.length} kết quả`}
          />
          <TransferTable transfers={filteredTransfers} onViewDetails={setSelectedTransferId} />
          
          {selectedTransferId && (
            <TransferDetailsModal
              transferId={selectedTransferId}
              onClose={() => setSelectedTransferId(null)}
            />
          )}
        </>
      )}
    </div>
  );
};
