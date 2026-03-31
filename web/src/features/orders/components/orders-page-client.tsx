'use client';
import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useOrders } from '../hooks/use-orders';
import { Order } from '../types';
import { CreateOrderModal } from './create-order-modal';
import { PageHeader } from '@/components/PageHeader';
import { OrderList } from './order-list';
import { useAuth } from '@/providers/AuthProvider';
import { useSearchParams } from 'next/navigation';

export const OrdersPageClient = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const searchParams = useSearchParams();

  const { user } = useAuth();
  const isManager = user?.role === 'WAREHOUSE_MANAGER';

  const { data: ordersData, isLoading, refetch } = useOrders(search);

  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch && urlSearch !== search) {
      setSearch(urlSearch);
    }
  }, [searchParams, search]);

  const rawData = (ordersData as any)?.data ?? ordersData;
  const orders: Order[] = Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData?.items)
      ? rawData.items
      : [];

  // Filter local for simplicity if backend doesn't support search yet
  const filteredOrders = orders.filter((o: Order) =>
    o.code?.toLowerCase().includes(search.toLowerCase()) ||
    (o as any).createdBy?.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full relative pb-24">
      <PageHeader
        title="Phiếu Giao Dịch Kho"
        description="Quản lý các lệnh yêu cầu Nhập/Xuất kho cho App Mobile"
        actions={
          isManager ? (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 bg-[#04147B] text-white px-5 py-2.5 rounded-[12px] font-bold text-[15px] shadow-sm hover:bg-[#030e57] transition-all"
              title="Tạo phiếu giao dịch kho"
            >
              <Plus className="w-5 h-5" />
              Tạo Phiếu Mới
            </button>
          ) : undefined
        }
      />

      <div className="mt-8">
        <OrderList
          orders={filteredOrders}
          isLoading={isLoading}
          onCreateRequest={() => setIsCreateModalOpen(true)}
          onRefresh={() => refetch()}
        />
      </div>

      {isCreateModalOpen && (
        <CreateOrderModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            refetch();
          }}
        />
      )}
    </div>
  );
};
