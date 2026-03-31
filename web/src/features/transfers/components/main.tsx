'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useTransfers } from '../hooks/use-transfers';
import { TransferStatCards } from './transfer-stat-cards';
import { TransferTable } from './transfer-table';
import { useAuth } from '@/providers/AuthProvider';

export const TransfersMain = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'WAREHOUSE_MANAGER';

  const { data, isLoading, error } = useTransfers('limit=100');
  
  // The backend wraps data in { success, data: { data: [], total, ... } }
  const responseData = data?.data;
  const transfers = Array.isArray(responseData?.data) 
    ? responseData.data 
    : Array.isArray(responseData) ? responseData : [];

  const metrics = {
    pending: transfers.filter((t: any) => t.status === 'PENDING').length,
    completed: transfers.filter((t: any) => t.status === 'COMPLETED').length,
    cancelled: transfers.filter((t: any) => t.status === 'CANCELLED').length,
    totalTagsInTransit: transfers
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
          <TransferTable transfers={transfers} />
        </>
      )}
    </div>
  );
};
