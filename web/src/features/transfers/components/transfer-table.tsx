import React, { useMemo, useState } from 'react';
import { TransferData, TransferType, TransferStatus } from '../types';
import { ArrowRight, CheckCircle2, Clock, XCircle, MapPin, Truck, Edit, Trash2, ChevronUp, ChevronDown, ChevronsUpDown, FileText } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { hasAdminAccess } from '@/utils/role-helpers';
import { useQueryClient } from '@tanstack/react-query';
import { httpClient } from '@/lib/http/client';
import { EditTransferModal } from './edit-transfer-modal';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface TransferTableProps {
  transfers: TransferData[];
  onViewDetails?: (id: string) => void;
}

type SortKey = 'createdAt' | 'code' | 'route' | 'volume' | 'status';
type SortDirection = 'asc' | 'desc';

const getTypeLabel = (type: TransferType) => {
  switch (type) {
    case 'ADMIN_TO_WORKSHOP': return 'Admin -> Xưởng';
    case 'WORKSHOP_TO_WAREHOUSE': return 'Xưởng -> Kho';
    case 'WAREHOUSE_TO_CUSTOMER': return 'Kho -> Khách';
    default: return type;
  }
};

const getStatusBadge = (status: TransferStatus) => {
  switch (status) {
    case 'PENDING':
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-600"><Clock className="w-3.5 h-3.5" /> ĐANG GIAO</span>;
    case 'COMPLETED':
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /> HOÀN TẤT</span>;
    case 'CANCELLED':
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500"><XCircle className="w-3.5 h-3.5" /> ĐÃ HỦY</span>;
  }
};

export const TransferTable: React.FC<TransferTableProps> = ({ transfers, onViewDetails }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [editingTransfer, setEditingTransfer] = useState<TransferData | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>({
    key: 'createdAt',
    direction: 'desc',
  });

  const isWarehouseManager = user?.role === 'WAREHOUSE_MANAGER';
  const isAdmin = hasAdminAccess(user?.role);

  const getSortableValue = (transfer: TransferData, key: SortKey): string | number => {
    switch (key) {
      case 'createdAt':
        return new Date((transfer as any).created_at || transfer.createdAt || 0).getTime();
      case 'code':
        return transfer.code || '';
      case 'route':
        return `${transfer.source?.name || ''} ${transfer.destination?.name || ''}`;
      case 'volume':
        return transfer.items?.length || 0;
      case 'status':
        return transfer.status || '';
      default:
        return '';
    }
  };

  const sortedTransfers = useMemo(() => {
    if (!sortConfig) return transfers;
    const { key, direction } = sortConfig;
    const multiplier = direction === 'asc' ? 1 : -1;

    return [...transfers].sort((a, b) => {
      const aValue = getSortableValue(a, key);
      const bValue = getSortableValue(b, key);

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * multiplier;
      }

      return String(aValue).localeCompare(String(bValue), 'vi', { sensitivity: 'base' }) * multiplier;
    });
  }, [transfers, sortConfig]);

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => {
      if (!prev || prev.key !== key) return { key, direction: 'asc' };
      return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
    });
  };

  const renderSortIcon = (key: SortKey) => {
    const isActive = sortConfig?.key === key;
    if (!isActive) {
      return <ChevronsUpDown className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortConfig?.direction === 'asc'
      ? <ChevronUp className="w-3.5 h-3.5 text-[#04147B]" />
      : <ChevronDown className="w-3.5 h-3.5 text-[#04147B]" />;
  };

  const [actionModal, setActionModal] = useState<{ type: 'receive' | 'cancel', transfer: TransferData } | null>(null);

  const handleConfirm = (transfer: TransferData) => {
    setActionModal({ type: 'receive', transfer });
  };

  const handleCancel = (transfer: TransferData) => {
    setActionModal({ type: 'cancel', transfer });
  };

  const executeActionModal = async () => {
    if (!actionModal) return;
    const { type, transfer } = actionModal;

    try {
      if (type === 'receive') {
        setConfirmingId(transfer.id);
        await httpClient(`/transfers/${transfer.id}/confirm`, {
          method: 'POST',
          body: JSON.stringify({})
        });
        toast.success('Đã cập nhật trạng thái nhận hàng!');
      } else {
        setCancelingId(transfer.id);
        await httpClient(`/transfers/${transfer.id}/cancel`, {
          method: 'POST'
        });
        toast.success('Đã huỷ lệnh điều chuyển thành công!');
      }
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    } catch (e: any) {
      toast.error(`Lỗi: ${e.message}`);
    } finally {
      if (type === 'receive') setConfirmingId(null);
      if (type === 'cancel') setCancelingId(null);
      setActionModal(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto bg-white rounded-[20px] border border-slate-100 shadow-sm mb-4 xl:mb-6">
        <table className="w-full text-sm text-left border-collapse min-w-[1000px]">
          <thead className="sticky top-0 z-10 bg-white shadow-sm border-b border-slate-100">
            <tr>
              <th className="px-5 py-4 text-[11px] font-black tracking-widest text-slate-500 uppercase">
                <button onClick={() => handleSort('createdAt')} className="flex items-center gap-1.5 group">
                  NGÀY TẠO {renderSortIcon('createdAt')}
                </button>
              </th>
              <th className="px-5 py-4 text-[11px] font-black tracking-widest text-slate-500 uppercase">
                <button onClick={() => handleSort('code')} className="flex items-center gap-1.5 group">
                  MÃ LỆNH {renderSortIcon('code')}
                </button>
              </th>
              <th className="px-5 py-4 text-[11px] font-black tracking-widest text-slate-500 uppercase">
                <button onClick={() => handleSort('route')} className="flex items-center gap-1.5 group">
                  TUYẾN ĐƯỜNG {renderSortIcon('route')}
                </button>
              </th>
              <th className="px-5 py-4 text-[11px] font-black tracking-widest text-slate-500 uppercase text-center">
                <button onClick={() => handleSort('volume')} className="inline-flex items-center gap-1.5 group">
                  KHỐI LƯỢNG {renderSortIcon('volume')}
                </button>
              </th>
              <th className="px-5 py-4 text-[11px] font-black tracking-widest text-slate-500 uppercase">
                <button onClick={() => handleSort('status')} className="flex items-center gap-1.5 group">
                  TIẾN ĐỘ {renderSortIcon('status')}
                </button>
              </th>
              <th className="px-5 py-4 text-[11px] font-black tracking-widest text-slate-500 uppercase text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sortedTransfers.map((tr) => {
              const rawDate = (tr as any).created_at || tr.createdAt;
              const dateObj = rawDate ? new Date(rawDate) : new Date();
              const date = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
              const time = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
              const canEditDestination = !isAdmin && tr.status === 'PENDING';
              const canCancel = isAdmin && tr.status === 'PENDING';

              return (
                <tr key={tr.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-800 text-[13px]">{date}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{time}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="inline-block bg-[#04147B]/5 text-[#04147B] font-mono text-[11px] px-2.5 py-1 rounded-[6px] font-bold border border-indigo-100">
                      {tr.code}
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-1.5">
                      {getTypeLabel(tr.type)}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold mb-0.5">NƠI ĐI</span>
                        <div className="flex items-center gap-1 text-[13px] font-bold text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" /> {tr.source?.name || 'N/A'}
                        </div>
                      </div>
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-400">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-indigo-400 font-bold mb-0.5 uppercase tracking-widest">Nơi nhận</span>
                        <div className="flex items-center gap-1 text-[13px] font-black text-[#04147B]">
                          <MapPin className="w-3.5 h-3.5 text-indigo-400" /> {tr.destination?.name || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="text-xl font-black text-slate-800 tracking-tight">
                      {tr.items?.length || 0}
                    </div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Tags</div>
                  </td>
                  <td className="px-5 py-4">
                    {getStatusBadge(tr.status)}
                  </td>
                  <td className="px-5 py-4 text-right align-middle">
                    <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onViewDetails?.(tr.id)}
                        className="w-8 h-8 inline-flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors focus:outline-none"
                        title="Xem chi tiết lệnh"
                      >
                        <FileText className="w-4 h-4" />
                      </button>

                      {tr.status === 'PENDING' && isWarehouseManager && (
                        <button
                          disabled={confirmingId === tr.id}
                          onClick={() => handleConfirm(tr)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-indigo-200 disabled:opacity-50 inline-flex items-center gap-2"
                        >
                          <Truck className="w-3.5 h-3.5 flex-none" />
                          {confirmingId === tr.id ? 'Loading...' : 'Nhận Hàng'}
                        </button>
                      )}

                      {canEditDestination && (
                        <button
                          onClick={() => setEditingTransfer(tr)}
                          className="w-8 h-8 inline-flex items-center justify-center text-slate-400 hover:text-[#04147B] hover:bg-indigo-50 rounded-lg transition-colors focus:outline-none"
                          title="Đổi xưởng nhận"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}

                      {canCancel && (
                        <button
                          onClick={() => handleCancel(tr)}
                          disabled={cancelingId === tr.id}
                          className="w-8 h-8 inline-flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none disabled:opacity-50"
                          title="Huỷ điều chuyển"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {transfers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <Truck className="w-12 h-12 text-slate-200 mx-auto mb-3" strokeWidth={1} />
                  <p className="text-slate-500 font-medium">Chưa có dữ liệu điều chuyển nào.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {editingTransfer && (
        <EditTransferModal
          transfer={editingTransfer}
          onClose={() => setEditingTransfer(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['transfers'] });
            setEditingTransfer(null);
          }}
        />
      )}

      {/* CONFIRM ACTION MODAL */}
      <ConfirmDialog 
        isOpen={!!actionModal}
        title={actionModal?.type === 'receive' ? 'Xác nhận Nhận Hàng' : 'Xác nhận Huỷ Điều Chuyển'}
        description={actionModal?.type === 'receive' 
          ? `Xác nhận nhận lô RFID ${actionModal.transfer.code}? Backend hệ thống sẽ kiểm tra xem mảng tags đã quét đủ chưa.` 
          : `Bạn có chắc muốn huỷ lệnh điều chuyển ${actionModal?.transfer.code}? Hành động này không thể hoàn tác.`}
        confirmText={actionModal?.type === 'receive' ? 'Nhận Hàng' : 'Huỷ Lệnh'}
        variant={actionModal?.type === 'receive' ? 'primary' : 'danger'}
        onConfirm={executeActionModal}
        isLoading={confirmingId !== null || cancelingId !== null}
        onClose={() => setActionModal(null)}
      />
    </div>
  );
};
