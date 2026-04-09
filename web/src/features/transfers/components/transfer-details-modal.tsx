import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTransfer } from '../api/get-transfer';
import { TransferData } from '../types';
import { 
  X, Loader2, Package, 
  MapPin, Clock, Calendar, 
  Truck, CheckCircle2, ListChecks, 
  Printer, ArrowUpRight, ChevronRight,
  User as UserIcon, Radio, MoreVertical
} from 'lucide-react';

export const TransferDetailsModal = ({ transferId, onClose }: { transferId: string, onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info');

  const { data: transfer, isLoading, error } = useQuery<TransferData>({
    queryKey: ['transfer', transferId],
    queryFn: () => getTransfer(transferId),
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#04147B]/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="bg-white/80 p-8 rounded-[32px] shadow-2xl flex flex-col items-center gap-4 border border-white">
          <Loader2 className="w-8 h-8 animate-spin text-[#04147B]" />
          <span className="font-black text-[#04147B] tracking-tight">Đang đồng bộ lệnh điều chuyển...</span>
        </div>
      </div>
    );
  }

  if (error || !transfer) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white p-8 rounded-[32px] shadow-2xl flex flex-col items-center gap-6 max-w-sm border border-slate-100" onClick={e => e.stopPropagation()}>
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500 border border-red-100 scale-110">
            <X className="w-8 h-8" strokeWidth={2.5} />
          </div>
          <p className="font-black text-slate-800 text-lg text-center tracking-tight">Lỗi tải lệnh điều chuyển.</p>
          <button onClick={onClose} className="px-8 py-3 bg-[#04147B] text-white font-black rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-95 w-full">Đóng cửa sổ</button>
        </div>
      </div>
    );
  }

  const statusBadge = (
    <div className="flex gap-2">
      <span className="bg-[#04147B] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-700 shadow-sm flex items-center justify-center">
        {transfer.type === 'ADMIN_TO_WORKSHOP' ? 'NHẬP KHO' : 
         transfer.type === 'WORKSHOP_TO_WAREHOUSE' ? 'ĐIỀU CHUYỂN' : 
         transfer.type === 'WAREHOUSE_TO_CUSTOMER' ? 'XUẤT KHO' : transfer.type}
      </span>
      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm flex items-center justify-center ${
        transfer.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
        'bg-amber-50 text-amber-600 border-amber-100'
      }`}>
        {transfer.status === 'PENDING' ? 'PENDING' : 
         transfer.status === 'COMPLETED' ? 'HOÀN TẤT' : transfer.status}
      </span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#04147B]/10 backdrop-blur-[6px] flex flex-col justify-end sm:items-center sm:justify-center z-50 p-0 sm:p-5" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-4xl sm:rounded-[48px] rounded-t-[48px] shadow-[0_32px_120px_-20px_rgba(4,20,123,0.15)] flex flex-col h-full sm:h-[90vh] overflow-hidden transform transition-all border border-slate-100/50"
        onClick={e => e.stopPropagation()}
      >
        {/* MODAL HEADER (Figma styled) */}
        <div className="px-8 pt-8 pb-6 bg-white border-b border-slate-100 relative">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="space-y-3">
              {statusBadge}
              <div className="space-y-1">
                <h2 className="text-[32px] font-black text-slate-800 tracking-tighter leading-tight">{transfer.code}</h2>
                <div className="flex items-center gap-2 text-slate-400 font-bold text-[13px]">
                   <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Lệnh Điều Chuyển</span>
                   <span>•</span>
                   <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {transfer.source?.name} → {transfer.destination?.name}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-black text-sm rounded-full transition-all border border-slate-200">
                <Printer className="w-4 h-4" /> In nhãn
              </button>
              <button 
                onClick={() => {}} 
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#04147B] hover:bg-[#030d63] text-white font-black text-sm rounded-full transition-all shadow-lg shadow-indigo-200"
              >
                Gửi lô hàng <ArrowUpRight className="w-4 h-4" />
              </button>
              <button onClick={onClose} className="p-3 hover:bg-slate-50 rounded-2xl text-slate-300 hover:text-slate-900 transition-colors hidden sm:block">
                <X className="w-7 h-7" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* TAB NAVIGATION */}
          <div className="flex gap-8 mt-8 border-t border-slate-100 pt-6">
            {[
              { id: 'info', label: 'Thông tin chung' },
              { id: 'history', label: 'Lịch sử quét RFID' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-4 text-sm font-black transition-all relative ${
                  activeTab === tab.id ? 'text-[#04147B]' : 'text-slate-300 hover:text-slate-400'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#04147B] rounded-t-full shadow-[0_-2px_10px_rgba(4,20,123,0.3)]" />}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto bg-slate-50/30 p-8 custom-scrollbar">
          
          {/* TAB 1: THÔNG TIN CHUNG */}
          {activeTab === 'info' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Start point */}
                 <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Điểm xuất phát</p>
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <MapPin className="w-6 h-6" />
                       </div>
                       <div>
                          <p className="font-black text-slate-800 tracking-tight">{transfer.source?.name}</p>
                          <p className="text-xs text-slate-400 font-bold">{(transfer.source as any)?.address || 'N/A'}</p>
                       </div>
                    </div>
                 </div>

                 {/* Dest point */}
                 <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Điểm tiếp nhận</p>
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <MapPin className="w-6 h-6" />
                       </div>
                       <div>
                          <p className="font-black text-slate-800 tracking-tight">{transfer.destination?.name}</p>
                          <p className="text-xs text-slate-400 font-bold">{(transfer.destination as any)?.address || 'N/A'}</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Items Summary */}
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col justify-between overflow-hidden relative">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Danh mục sản phẩm yêu cầu</h3>
                    <div className="bg-slate-50 px-4 py-1.5 rounded-full text-[11px] font-black border border-slate-100 uppercase tracking-widest">
                       {transfer.items?.length || 0} SKU
                    </div>
                 </div>

                 <div className="grid grid-cols-1 gap-4">
                    {transfer.items && transfer.items.length > 0 ? (
                      transfer.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-[#04147B]">
                                 <Package className="w-5 h-5" />
                              </div>
                              <div>
                                 <p className="font-black text-slate-800 text-sm tracking-tight">{item.tag.epc}</p>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.tag.product?.name || 'Chưa gán SP'}</p>
                              </div>
                           </div>
                           <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                              item.scannedAt ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                           }`}>
                              {item.scannedAt ? 'Đã quét' : '0 / 1'}
                           </div>
                        </div>
                      )).slice(0, 10)
                    ) : (
                       <p className="text-center py-10 text-slate-400 font-bold">Không có dữ liệu thẻ trong lệnh này.</p>
                    )}
                    {transfer.items && transfer.items.length > 10 && (
                      <p className="text-center text-[11px] font-black text-slate-300 uppercase mt-4">Và {transfer.items.length - 10} thẻ khác...</p>
                    )}
                 </div>
              </div>
            </div>
          )}

          {/* TAB 2: RFID HISTORY */}
          {activeTab === 'history' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 text-center py-20 space-y-4">
               <Radio className="w-16 h-16 text-slate-200 mx-auto" />
               <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Cảm biến RFID đang gộp dữ liệu lịch sử...</p>
            </div>
          )}
        </div>

        {/* STEPPER PROGRESS (Figma) */}
        {activeTab === 'info' && (
          <div className="px-8 py-10 bg-white border-t border-slate-50">
             <div className="flex items-center justify-between relative max-w-4xl mx-auto">
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-100 z-0" />
                
                {[
                  { label: 'Tạo phiếu', status: 'active' },
                  { label: 'Chờ xử lý', status: 'idle' },
                  { label: 'Đang quét', status: 'idle' },
                  { label: 'Hoàn tất', status: 'idle' }
                ].map((step, idx) => (
                  <div key={idx} className="relative z-10 flex flex-col items-center gap-3">
                     <div className={`w-11 h-11 rounded-full flex items-center justify-center border-4 ${
                       step.status === 'active' ? 'bg-[#04147B] border-indigo-100 text-white shadow-lg' : 'bg-white border-slate-50 text-slate-200'
                     }`}>
                        <div className={`w-2.5 h-2.5 rounded-full ${step.status === 'active' ? 'bg-white' : 'bg-slate-100'}`} />
                     </div>
                     <span className={`text-[11px] font-black uppercase tracking-widest ${step.status === 'active' ? 'text-[#04147B]' : 'text-slate-300'}`}>
                       {step.label}
                     </span>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="p-6 bg-white border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest italic">
             <Radio className="w-4 h-4" /> Dữ liệu được bảo mật bởi Riotex System
           </div>
           <button 
             onClick={onClose} 
             className="w-full md:w-auto px-8 py-3 bg-white border border-slate-200 text-slate-900 font-black rounded-2xl shadow-sm hover:bg-slate-50 transition-all text-sm uppercase tracking-wider"
           >
             Đóng Tab điều hướng
           </button>
        </div>
      </div>
    </div>
  );
};
