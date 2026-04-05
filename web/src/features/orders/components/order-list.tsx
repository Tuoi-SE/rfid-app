import { useState } from 'react';
import { Loader2, ArchiveX, InboxIcon } from 'lucide-react';
import { Order } from '../types';
import { OrderCard } from './order-card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EditOrderModal } from './edit-order-modal';
import { OrderDetailsModal } from './order-details-modal';
import { deleteOrder } from '../api/delete-order';

import { useAuth } from '@/providers/AuthProvider';
import { isSuperAdmin } from '@/utils/role-helpers';
import toast from 'react-hot-toast';

interface OrderListProps {
  orders: Order[];
  isLoading: boolean;
  onRefresh: () => void;
  onCreateRequest?: () => void;
}

export const OrderList = ({ orders, isLoading, onRefresh, onCreateRequest }: OrderListProps) => {
  const { user } = useAuth();
  const canCreate = isSuperAdmin(user?.role);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [viewingOrderId, setViewingOrderId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deletingOrderId) return;
    try {
      setIsDeleting(true);
      await deleteOrder(deletingOrderId);
      setDeletingOrderId(null);
      onRefresh();
    } catch (error: any) {
      console.error('Failed to delete order', error);
      toast.error(error.message || 'Không thể thực hiện. Vui lòng thử lại sau.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600 mb-4" />
        <p className="text-slate-500 font-medium">Đang tải danh sách phiếu...</p>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-slate-50/50 rounded-[24px] border border-dashed border-slate-200">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
          <InboxIcon className="w-8 h-8 text-slate-300" />
        </div>
        <p className="text-slate-500 font-bold text-lg mb-1">Chưa có giao dịch kho</p>
        <p className="text-slate-400 text-sm mb-6">Hãy tạo một phiếu nhập hoặc xuất để bắt đầu.</p>
        {canCreate && onCreateRequest && (
          <button
            onClick={onCreateRequest}
            className="px-6 py-3 bg-amber-50 text-amber-700 font-bold text-sm rounded-xl hover:bg-amber-100 transition-colors"
            title="Tạo phiếu giao dịch"
          >
            Tạo phiếu giao dịch
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 mt-6">
        {orders.map((order: Order) => (
          <OrderCard
            key={order.id}
            order={order}
            onEdit={(id) => setEditingOrderId(id)}
            onDelete={(id) => setDeletingOrderId(id)}
            onView={(id) => setViewingOrderId(id)}
          />
        ))}

        <div className="mt-12 mb-8 bg-transparent border-2 border-dashed border-slate-200 rounded-[24px] p-10 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center mb-6">
            <ArchiveX className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-[14px] font-bold text-slate-400 uppercase tracking-widest mb-2">Hết danh sách</h3>
          <p className="text-[13px] text-slate-400 max-w-[250px]">Bạn đã xem phần cuối của toàn bộ giao dịch hiển thị trong bảng</p>
        </div>
      </div>

      {editingOrderId && (
        <EditOrderModal
          orderId={editingOrderId}
          onClose={() => setEditingOrderId(null)}
          onSuccess={() => {
            setEditingOrderId(null);
            onRefresh();
          }}
        />
      )}

      {viewingOrderId && (
        <OrderDetailsModal
          orderId={viewingOrderId}
          onClose={() => setViewingOrderId(null)}
        />
      )}

      <ConfirmDialog
        isOpen={!!deletingOrderId}
        onClose={() => setDeletingOrderId(null)}
        onConfirm={handleDelete}
        title="Xác nhận xóa phiếu"
        description={`Hành động này sẽ Xóa vĩnh viễn phiếu kho. Không thể khôi phục. Bạn có chắc chắn không?`}
        confirmText="Xác nhận Xóa"
        cancelText="Hủy bỏ"
        isLoading={isDeleting}
      />
    </>
  );
};
