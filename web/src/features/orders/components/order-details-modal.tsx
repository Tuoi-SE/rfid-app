import { useQuery } from '@tanstack/react-query';
import { getOrder } from '../api/get-order';
import { Order } from '../types';
import { X, Loader2, Info, Package, Search } from 'lucide-react';


export const OrderDetailsModal = ({ orderId, onClose }: { orderId: string, onClose: () => void }) => {
  const { data: order, isLoading, error } = useQuery<Order>({
    queryKey: ['order', orderId],
    queryFn: () => getOrder(orderId),
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
        <div className="bg-white p-6 rounded-[24px] shadow-xl flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
          <span className="font-semibold text-slate-700">Đang tải chi tiết lệnh...</span>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white p-6 rounded-[24px] shadow-xl flex flex-col items-center gap-4 max-w-sm" onClick={e => e.stopPropagation()}>
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-500">
            <X className="w-6 h-6" />
          </div>
          <p className="font-semibold text-slate-700 text-center">Lỗi khi tải dữ liệu đơn hàng.</p>
          <button onClick={onClose} className="px-6 py-2 bg-slate-100 font-bold rounded-xl mt-2 w-full text-slate-700">Đóng</button>
        </div>
      </div>
    );
  }

  const statusColor = {
    PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
    PROCESSING: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
  }[order.status];

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] flex flex-col justify-end sm:items-center sm:justify-center z-50 transition-all p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-2xl sm:rounded-[24px] rounded-t-[24px] shadow-[0_-5px_40px_rgba(0,0,0,0.1)] flex flex-col max-h-[90vh] overflow-hidden transform transition-all border sm:border-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="px-6 py-5 bg-gradient-to-b from-slate-50/80 to-white border-b border-slate-100 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-[12px] bg-slate-100 flex items-center justify-center text-slate-600">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">{order.code}</h2>
                <div className="flex gap-2 items-center mt-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${order.type === 'INBOUND' ? 'bg-[#04147B]/10 text-[#04147B] border-[#04147B]/20' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                    {order.type === 'INBOUND' ? 'NHẬP KHO' : 'XUẤT KHO'}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusColor}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 cursor-pointer hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* INFO GRID */}
        <div className="p-6 bg-slate-50/50 border-b border-slate-100">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[12px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Ngày tạo</p>
              <p className="text-[14px] font-bold text-slate-700">{new Date(order.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div>
              <p className="text-[12px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Tiến độ</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${order.progress === 100 ? 'bg-emerald-500' : 'bg-[#04147B]'}`}
                    style={{ width: `${order.progress || 0}%` }}
                  />
                </div>
                <span className="text-[13px] font-bold text-slate-600">{order.progress || 0}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* ITEMS */}
        <div className="p-6 overflow-y-auto">
          <h3 className="text-[14px] font-bold text-slate-700 mb-4 flex items-center gap-2 uppercase tracking-wide">
            <Package className="w-4 h-4" /> Danh sách Sản phẩm
          </h3>
          <div className="space-y-3">
            {order.items?.map((item: any, index: number) => (
              <div key={index} className="flex flex-col sm:flex-row gap-3 p-4 bg-white border border-slate-200 rounded-[16px]">
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-[14px]">{(item.product as any)?.name || 'Sản phẩm lỗi'}</p>
                  <p className="text-[12px] text-slate-500 font-mono mt-0.5 max-w-[200px] truncate">SKU: {(item.product as any)?.sku || 'N/A'}</p>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-[12px]">
                  <div className="text-center min-w-[60px]">
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Yêu cầu</p>
                    <p className="font-black text-slate-700 text-[16px]">{item.quantity}</p>
                  </div>
                  <div className="w-px h-8 bg-slate-200" />
                  <div className="text-center min-w-[60px]">
                    <p className="text-[11px] font-bold text-green-600 uppercase">Thực tế</p>
                    <p className="font-black text-green-600 text-[16px]">{item.scannedQuantity || 0}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 sm:p-6 bg-slate-50/80 border-t border-slate-100">
          <button onClick={onClose} className="w-full sm:w-auto sm:float-right px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-[12px] shadow-sm hover:bg-slate-50">
            Đóng cửa sổ
          </button>
          <div className="clear-both" />
        </div>
      </div>
    </div>
  );
};
