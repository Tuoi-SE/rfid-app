import React, { useState } from 'react';
import { TransferData, TransferType, TransferStatus } from '../types';
import { Filter, ArrowRight, CheckCircle2, Clock, XCircle, MapPin, Truck, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useQueryClient } from '@tanstack/react-query';
import { httpClient } from '@/lib/http/client';
import { EditTransferModal } from './edit-transfer-modal';

interface TransferTableProps {
  transfers: TransferData[];
}

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
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /> HÒAN TẤT</span>;
    case 'CANCELLED':
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500"><XCircle className="w-3.5 h-3.5" /> ĐÃ HỦY</span>;
  }
};

export const TransferTable: React.FC<TransferTableProps> = ({ transfers }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [editingTransfer, setEditingTransfer] = useState<TransferData | null>(null);

  const isWarehouseManager = user?.role === 'WAREHOUSE_MANAGER';
  const isAdmin = user?.role === 'ADMIN';

  const handleConfirm = async (transfer: TransferData) => {
    // Note: D-14 backend validation requires ALL items to be scanned. We can mock or alert if needed.
    const hasUnscanned = transfer.items.some(i => !i.scannedAt);
    
    // The backend logic says standard confirmations require items to be scanned first in a normal workflow.
    // We assume the RFID mobile terminal checks it, but let's just trigger the confirm API.
    if (!window.confirm(`Xác nhận nhận lô RFID ${transfer.code}? Backend hệ thống sẽ kiểm tra xem mảng tags đã quét đủ chưa.`)) {
      return;
    }

    try {
      setConfirmingId(transfer.id);
      await httpClient(`/transfers/${transfer.id}/confirm`, {
        method: 'POST',
        body: JSON.stringify({})
      });
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      alert('Đã cập nhật trạng thái nhận hàng!');
    } catch (e: any) {
      alert(`Lỗi: ${e.message}`);
    } finally {
      setConfirmingId(null);
    }
  };

  const handleCancel = async (transfer: TransferData) => {
    if (!window.confirm(`Bạn có chắc muốn huỷ lệnh điều chuyển ${transfer.code}? Hành động này không thể hoàn tác.`)) {
      return;
    }

    try {
      setCancelingId(transfer.id);
      await httpClient(`/transfers/${transfer.id}/cancel`, {
        method: 'POST'
      });
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      alert('Đã huỷ lệnh điều chuyển thành công!');
    } catch (e: any) {
      alert(`Lỗi: ${e.message}`);
    } finally {
      setCancelingId(null);
    }
  };

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_2px_15px_rgb(0,0,0,0.02)] overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
        <h3 className="text-base font-bold text-slate-800">Sổ cái luân chuyển</h3>
        <div className="flex items-center gap-2">
          <button className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:text-[#04147B] hover:bg-indigo-50 transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">Ngày Tạo</th>
              <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">Mã Lệnh</th>
              <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">Tuyến Đường</th>
              <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase text-center">Khối Lượng</th>
              <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">Tiến Độ</th>
              <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase text-right">Quản lý nhận hàng</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {transfers.map((tr) => {
              const rawDate = (tr as any).created_at || tr.createdAt;
              const dateObj = rawDate ? new Date(rawDate) : new Date();
              const date = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
              const time = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
              
              return (
                <tr key={tr.id} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800 text-[13px]">{date}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{time}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-block bg-[#04147B]/5 text-[#04147B] font-mono text-[11px] px-2.5 py-1 rounded-[6px] font-bold border border-indigo-100">
                      {tr.code}
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-1.5">
                      {getTypeLabel(tr.type)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
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
                  <td className="px-6 py-4 text-center">
                    <div className="text-xl font-black text-slate-800 tracking-tight">
                      {tr.items?.length || 0}
                    </div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Tags</div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(tr.status)}
                  </td>
                  <td className="px-6 py-4 text-right align-middle">
                    <div className="flex items-center justify-end gap-2">
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
                      
                      {isAdmin && tr.status === 'PENDING' && (
                        <button 
                          onClick={() => setEditingTransfer(tr)}
                          className="w-8 h-8 inline-flex items-center justify-center text-slate-400 hover:text-[#04147B] hover:bg-indigo-50 rounded-lg transition-colors focus:outline-none"
                          title="Đổi xưởng nhận"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}

                      {tr.status === 'PENDING' && isAdmin && (
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
    </div>
  );
};
