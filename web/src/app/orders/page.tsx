'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, ArchiveX, MapPin, Loader2, ClipboardList, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import CreateOrderModal from '@/components/CreateOrderModal';

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  scannedQuantity: number;
  product: { name: string; sku: string };
}

interface Order {
  id: string;
  code: string;
  type: 'INBOUND' | 'OUTBOUND';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  userId: string;
  user: { username: string };
  createdAt: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const { data: ordersData, isLoading, refetch } = useQuery<{ data: Order[] }>({
    queryKey: ['orders', search],
    queryFn: () => api.getOrders(''), // We can add search filter later on the backend
  });

  const orders = ordersData?.data ?? ordersData ?? ([] as Order[]);

  // Filter local for simplicity if backend doesn't support search yet
  const filteredOrders = orders.filter((o: Order) => 
    o.code.toLowerCase().includes(search.toLowerCase()) || 
    o.user.username.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'PENDING':
        return <span className="inline-flex items-center bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-medium">Chờ xử lý</span>;
      case 'IN_PROGRESS':
        return <span className="inline-flex items-center bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full text-xs font-medium">Đang Quét</span>;
      case 'COMPLETED':
        return <span className="inline-flex items-center bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full text-xs font-medium">Hoàn thành</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full text-xs font-medium">Đã hủy</span>;
    }
  };

  const getProgress = (items: OrderItem[]) => {
    const totalReq = items.reduce((acc, curr) => acc + curr.quantity, 0);
    const totalScan = items.reduce((acc, curr) => acc + curr.scannedQuantity, 0);
    const pct = totalReq === 0 ? 0 : Math.round((totalScan / totalReq) * 100);
    return { scan: totalScan, req: totalReq, pct };
  };

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-indigo-500" />
            Phiếu Giao Dịch Kho
          </h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý các lệnh yêu cầu Nhập/Xuất kho cho App Mobile</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Tạo Phiếu Mới
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm kiếm theo mã phiếu hoặc người tạo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all bg-white"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
        </div>
      ) : !filteredOrders || filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-100">
          <ArchiveX className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Chưa có phiếu giao dịch nào được tạo.</p>
          <button onClick={() => setIsCreateModalOpen(true)} className="text-indigo-600 text-sm mt-2 hover:underline">Tạo phiếu đầu tiên</button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order: Order) => {
            const prog = getProgress(order.items);
            return (
              <div key={order.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    {/* Left details */}
                    <div className="flex-1 flex gap-4">
                      <div className={`mt-1 shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border shadow-sm ${
                        order.type === 'INBOUND' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-pink-50 border-pink-100 text-pink-600'
                      }`}>
                        {order.type === 'INBOUND' ? <ArrowRight className="w-6 h-6 rotate-90" /> : <ArrowRight className="w-6 h-6 -rotate-90" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <h3 className="text-lg font-bold text-slate-800">{order.code}</h3>
                          {getStatusBadge(order.status)}
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            order.type === 'INBOUND' ? 'bg-indigo-100 text-indigo-700' : 'bg-pink-100 text-pink-700'
                          }`}>
                            {order.type === 'INBOUND' ? 'NHẬP KHO' : 'XUẤT KHO'}
                          </span>
                        </div>
                        <div className="text-sm text-slate-500 mb-4 flex items-center gap-4 flex-wrap">
                          <span className="flex items-center gap-1">
                            Người tạo: <strong className="text-slate-700">{order.user.username}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            Ngày tạo: {new Date(order.createdAt).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 w-full overflow-x-auto">
                          <table className="w-full text-sm min-w-[500px]">
                            <thead className="text-slate-500 border-b border-slate-200">
                              <tr>
                                <th className="pb-2 font-medium text-left">Sản phẩm</th>
                                <th className="pb-2 font-medium text-right w-24">Yêu cầu</th>
                                <th className="pb-2 font-medium text-right w-24">Thực tế</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {order.items.map((item) => (
                                <tr key={item.id}>
                                  <td className="py-2.5 flex items-center gap-2">
                                    <span className="text-slate-700 font-medium truncate max-w-[200px] md:max-w-none">{item.product.name}</span>
                                    <span className="text-xs text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">[{item.product.sku}]</span>
                                  </td>
                                  <td className="py-2.5 text-right font-medium text-slate-600">{item.quantity}</td>
                                  <td className="py-2.5 text-right font-medium font-mono">
                                    <span className={item.scannedQuantity === item.quantity ? 'text-emerald-600' : item.scannedQuantity > 0 ? 'text-indigo-600' : 'text-slate-400'}>
                                      {item.scannedQuantity}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right progress */}
                    <div className="md:w-48 shrink-0 md:border-l border-t md:border-t-0 border-slate-100 md:pl-6 pt-4 md:pt-0 pb-2 flex flex-col justify-center">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Tiến độ Quét</div>
                      <div className="text-3xl font-bold text-slate-800 mb-3 font-mono tracking-tight">
                        {prog.scan} <span className="text-lg text-slate-400 font-medium">/ {prog.req}</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ease-out ${prog.pct === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                          style={{ width: `${Math.min(prog.pct, 100)}%` }} 
                        />
                      </div>
                      <div className="text-right mt-1.5 text-xs font-medium text-slate-500">{prog.pct}% hoàn thành</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
}
