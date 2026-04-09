import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getOrder } from '../api/get-order';
import { Order } from '../types';
import { 
  X, Loader2, Package, Search, 
  MapPin, Clock, Calendar, 
  Truck, CheckCircle2, ListChecks, 
  Printer, ArrowUpRight, ChevronRight,
  User as UserIcon, Radio, MoreVertical
} from 'lucide-react';

export const OrderDetailsModal = ({ orderId, onClose }: { orderId: string, onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'transport' | 'history'>('info');

  const { data: order, isLoading, error } = useQuery<Order>({
    queryKey: ['order', orderId],
    queryFn: () => getOrder(orderId),
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#04147B]/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="bg-white/80 p-8 rounded-[32px] shadow-2xl flex flex-col items-center gap-4 border border-white">
          <Loader2 className="w-8 h-8 animate-spin text-[#04147B]" />
          <span className="font-black text-[#04147B] tracking-tight">Đang đồng bộ dữ liệu...</span>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white p-8 rounded-[32px] shadow-2xl flex flex-col items-center gap-6 max-w-sm border border-slate-100" onClick={e => e.stopPropagation()}>
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500 border border-red-100 scale-110">
            <X className="w-8 h-8" strokeWidth={2.5} />
          </div>
          <p className="font-black text-slate-800 text-lg text-center tracking-tight">Lỗi hệ thống khi tải đơn hàng.</p>
          <button onClick={onClose} className="px-8 py-3 bg-[#04147B] text-white font-black rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-95 w-full">Đóng cửa sổ</button>
        </div>
      </div>
    );
  }

  const transport = order.transport || {
    eta: '26/10/2023 - 10:30',
    status: 'Đã tới khu vực',
    roadmap: {
      source: 'Kho xuất',
      intermediate: 'Trung chuyển Miền Trung',
      destination: 'Khu vực đích (Kho A2)'
    },
    timeline: [
      { id: '1', title: 'Đã tới khu vực trung chuyển', description: 'Đơn hàng đã được kiểm tra tại hub trung tâm', timestamp: '14:20, 24/10', actor: 'System-Auto', zone: 'DANANG_HUB_G4' },
      { id: '2', title: 'Rời kho nguồn', description: 'Kiện hàng đã rời Kho A1 và đang trên đường tới hub', timestamp: '08:45, 24/10', actor: 'Warehouse-Manager', zone: 'HANOI_WH_A1' },
      { id: '3', title: 'Tạo phiếu giao nhận', description: 'Phiếu kho đã được khởi tạo và gán lô RFID', timestamp: '16:30, 23/10', actor: 'Admin-System' },
    ]
  };

  const statusBadge = (
    <div className="flex gap-2">
      <span className="bg-[#04147B] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-700 shadow-sm flex items-center justify-center">
        {order.type === 'INBOUND' ? 'NHẬP KHO' : 'XUẤT KHO'}
      </span>
      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm flex items-center justify-center ${
        order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
        order.status === 'PROCESSING' ? 'bg-indigo-50 text-[#04147B] border-indigo-100' :
        'bg-amber-50 text-amber-600 border-amber-100'
      }`}>
        {order.status === 'PROCESSING' ? 'ĐANG XỬ LÝ' : 
         order.status === 'PENDING' ? 'CHỜ XỬ LÝ' : 
         order.status === 'COMPLETED' ? 'HOÀN TẤT' : order.status}
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
                <h2 className="text-[32px] font-black text-slate-800 tracking-tighter leading-tight">{order.code}</h2>
                <div className="flex items-center gap-2 text-slate-400 font-bold text-[13px]">
                   <span className="flex items-center gap-1"><Radio className="w-3.5 h-3.5" /> Đồng bộ kho nội bộ</span>
                   <span>•</span>
                   <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {order.location?.name || 'Warehouse A2-4'}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-black text-sm rounded-full transition-all border border-slate-200">
                <Printer className="w-4 h-4" /> In nhãn
              </button>
              {order.status === 'PENDING' && (
                <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-[#04147B] hover:bg-[#030e57] text-white font-black text-sm rounded-full transition-all shadow-[0_8px_20px_-4px_rgba(4,20,123,0.3)] group">
                  Gửi lô hàng <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              )}
              <button onClick={onClose} className="p-3 hover:bg-slate-50 rounded-2xl text-slate-300 hover:text-slate-900 transition-colors hidden sm:block">
                <X className="w-7 h-7" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* TAB NAVIGATION */}
          <div className="flex gap-8 mt-8 border-t border-slate-100 pt-6">
            {[
              { id: 'info', label: 'Thông tin chung' },
              { id: 'transport', label: 'Vận chuyển' },
              { id: 'history', label: 'Lịch sử quét' }
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
          
          {/* TAB 1: THÔNG TIN CHUNG (Includes Stepper) */}
          {activeTab === 'info' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              
              {/* Stepper / Timeline Component */}
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex justify-between items-center relative">
                  {/* Progress Line */}
                  <div className="absolute top-[22px] left-[10%] right-[10%] h-[4px] bg-slate-100 z-0">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-1000" 
                      style={{ width: order.status === 'COMPLETED' ? '100%' : order.status === 'PROCESSING' ? '66%' : order.status === 'PENDING' ? '33%' : '0%' }}
                    />
                  </div>

                  {/* Step Icons */}
                  {[
                    { id: 'CREATED', label: 'Tạo phiếu', active: true, done: true },
                    { id: 'PENDING', label: 'Chờ xử lý', active: order.status === 'PENDING' || order.status === 'PROCESSING' || order.status === 'COMPLETED', done: order.status !== 'PENDING' },
                    { id: 'SCANNING', label: 'Đang quét', active: order.status === 'PROCESSING' || order.status === 'COMPLETED', done: order.status === 'COMPLETED' },
                    { id: 'COMPLETED', label: 'Hoàn tất', active: order.status === 'COMPLETED', done: order.status === 'COMPLETED' }
                  ].map((step, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-3 relative z-10 basis-1/4">
                       <div className={`w-12 h-12 rounded-full border-[3px] flex items-center justify-center transition-all ${
                         step.done ? 'bg-emerald-500 border-emerald-200 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' :
                         step.active ? 'bg-white border-[#04147B] text-[#04147B] shadow-xl' :
                         'bg-white border-slate-100 text-slate-200'
                       }`}>
                         {step.done ? <CheckCircle2 className="w-6 h-6" /> : <div className="w-3 h-3 rounded-full bg-current" />}
                       </div>
                       <span className={`text-[11px] font-black uppercase tracking-widest ${step.active ? 'text-[#04147B]' : 'text-slate-300'}`}>
                         {step.label}
                       </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2"><Package className="w-5 h-5 text-slate-400" /> Danh mục sản phẩm yêu cầu</h3>
                   <span className="text-[12px] font-bold text-slate-400 uppercase bg-white px-3 py-1 rounded-full border border-slate-100">{order.items.length} SKU</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:text-[#04147B] transition-colors">
                        <Package className="w-7 h-7" />
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <p className="font-black text-slate-800 tracking-tight">{item.product.name}</p>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-none">SKU: {item.product.sku}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-baseline gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                          <span className="text-lg font-black text-slate-800 leading-none">{item.scannedQuantity}</span>
                          <span className="text-[11px] font-black text-slate-300 uppercase">/ {item.quantity}</span>
                        </div>
                        {item.scannedQuantity === item.quantity && (
                          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Đã khớp</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VẬN CHUYỂN (Roadmap & Timeline) */}
          {activeTab === 'transport' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              
              {/* ROADMAP VISUALIZER */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left: Summary */}
                <div className="lg:col-span-5 bg-[#04147B] text-white p-8 rounded-[40px] shadow-xl relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-bl-[100px] blur-sm transition-transform hover:scale-110 pointer-events-none" />
                  
                  <div className="relative z-10 space-y-6">
                    <div className="flex justify-between items-center">
                       <h3 className="text-xl font-black tracking-tight">Vận chuyển</h3>
                       <div className="bg-emerald-400/20 text-emerald-400 border border-emerald-400/30 px-4 py-1.5 rounded-full text-[12px] font-black flex items-center gap-2">
                         <span className="flex h-2 w-2 relative">
                           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                           <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                         </span>
                         {transport.status}
                       </div>
                    </div>
                    
                    <div className="space-y-1 py-10">
                      <p className="text-white/40 text-[12px] font-black uppercase tracking-widest">Thời gian dự kiến (ETA)</p>
                      <p className="text-2xl font-black tracking-tight">{transport.eta}</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white shadow-inner">
                          <MapPin className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-0.5">Vị trí hiện tại</p>
                          <p className="text-[14px] font-black">{transport.roadmap.intermediate || 'Trung chuyển Miền Trung'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Journey Graph */}
                <div className="lg:col-span-7 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col justify-between">
                   <div className="flex items-center justify-between mb-8">
                      <h3 className="text-[18px] font-black text-slate-800 tracking-tight">Lộ trình vận chuyển</h3>
                      <button className="text-[11px] font-black text-[#04147B] uppercase tracking-widest flex items-center gap-1.5 hover:gap-2 transition-all">Chi tiết <ChevronRight className="w-4 h-4" /></button>
                   </div>

                   <div className="flex-1 flex flex-col justify-center gap-10 py-4 px-4">
                      <div className="flex justify-between items-center relative gap-4">
                        {/* Connecting dashed line */}
                        <div className="absolute top-[35px] left-0 right-0 h-0 w-full border-t-[3px] border-dashed border-slate-100 z-0" />
                        
                        {/* Step markers */}
                        {[
                          { label: 'Kho xuất', done: true },
                          { label: 'Trung chuyển', active: true },
                          { label: 'Khu vực đích', pending: true },
                          { label: 'Hoàn tất', pending: true }
                        ].map((node, i) => (
                          <div key={i} className="flex flex-col items-center gap-4 relative z-10 flex-1">
                             <div className={`w-[70px] h-[70px] rounded-[24px] flex items-center justify-center transition-all duration-500 hover:scale-105 ${
                               node.done ? 'bg-[#04147B] text-white shadow-lg' :
                               node.active ? 'bg-[#04147B]/10 text-[#04147B] border-2 border-[#04147B] shadow-xl' :
                               'bg-slate-50 text-slate-300 border border-slate-100'
                             }`}>
                                {i === 0 ? <Package className="w-7 h-7" /> : 
                                 i === 1 ? <Truck className="w-7 h-7" /> : 
                                 i === 2 ? <MapPin className="w-7 h-7" /> : 
                                 <CheckCircle2 className="w-7 h-7" />}
                             </div>
                             <span className={`text-[10px] font-black uppercase tracking-widest text-center whitespace-pre-line leading-tight h-8 ${node.pending ? 'text-slate-300' : 'text-slate-800'}`}>
                               {node.label}
                             </span>
                          </div>
                        ))}
                      </div>
                   </div>
                </div>
              </div>

              {/* TRANSPORT TIMELINE LIST */}
              <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden mt-6">
                <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                   <h3 className="text-xl font-black text-slate-800 tracking-tight">Chi tiết lịch trình</h3>
                   <button className="flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-2xl transition-all border border-slate-200">
                     <Clock className="w-4 h-4" /> Xuất Log Giao Nhận
                   </button>
                </div>
                
                <div className="p-8 space-y-10">
                  {transport.timeline.map((event, i) => (
                    <div key={event.id} className="flex gap-8 relative group">
                      {/* Vertical line connector */}
                      {i !== transport.timeline.length - 1 && (
                        <div className="absolute top-10 bottom-[-40px] left-[19px] w-[2px] bg-slate-100 group-hover:bg-[#04147B]/20 transition-colors" />
                      )}

                      <div className={`w-10 h-10 rounded-2xl flex-none flex items-center justify-center transition-all duration-300 group-hover:scale-110 z-10 ${
                        i === 0 ? 'bg-[#04147B] text-white shadow-lg' : 'bg-white border-2 border-slate-100 text-slate-300'
                      }`}>
                         <div className="w-2.5 h-2.5 rounded-full bg-current" />
                      </div>

                      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-8 space-y-1.5">
                           <h4 className={`text-[17px] font-black tracking-tight ${i === 0 ? 'text-slate-800' : 'text-slate-500'}`}>{event.title}</h4>
                           <p className="text-[13px] text-slate-400 font-medium leading-relaxed">{event.description}</p>
                           {event.zone && (
                             <div className="flex mt-2">
                               <span className="bg-[#04147B]/10 text-[#04147B] text-[10px] font-black py-1 px-3 rounded-lg border border-indigo-100 uppercase tracking-widest">
                                 Zone: {event.zone}
                               </span>
                             </div>
                           )}
                        </div>
                        <div className="md:col-span-4 flex flex-col md:items-end justify-start gap-1">
                           <div className="flex items-center gap-2 text-slate-800 font-black text-[14px]">
                             <Clock className="w-3.5 h-3.5 text-slate-300" /> {event.timestamp}
                           </div>
                           <div className="text-[11px] font-bold text-[#04147B]/60 uppercase tracking-widest">
                             Người thực hiện: {event.actor}
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LỊCH SỬ QUÉT (Actual data from backend sessions) */}
          {activeTab === 'history' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
               <div className="flex justify-between items-center bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[16px] bg-slate-50 flex items-center justify-center text-[#04147B]">
                      <Radio className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none mb-1">Cảm biến RFID thời gian thực</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đang theo dõi dữ liệu từ Antenna 1, 2 và Handheld</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                       <p className="text-2xl font-black text-[#04147B] leading-none mb-1">{order.sessions?.length || 0}</p>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phát hiện phiên quét</p>
                    </div>
                    <div className="w-px h-10 bg-slate-100" />
                    <div className="text-right">
                       <p className="text-2xl font-black text-slate-800 leading-none mb-1">{order.items.reduce((a,c) => a + c.scannedQuantity, 0)}</p>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã EPC định danh</p>
                    </div>
                  </div>
               </div>

               <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
                  {order.sessions && order.sessions.length > 0 ? (
                    order.sessions.map((session, sIdx) => (
                      <div key={session.id} className="group">
                        <div className="p-6 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50 transition-colors pointer-cursor">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-lg">
                               {order.sessions!.length - sIdx}
                             </div>
                             <div className="space-y-0.5">
                               <p className="font-black text-slate-800 tracking-tight">{session.name}</p>
                               <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase">
                                 <Calendar className="w-3 h-3" /> {new Date(session.startedAt).toLocaleString('vi-VN')}
                                 <span>•</span>
                                 <UserIcon className="w-3 h-3" /> {session.user?.username || 'Actor'}
                               </div>
                             </div>
                          </div>
                          
                          <div className="flex items-center gap-6">
                             <div className="text-center">
                               <p className="text-lg font-black text-[#04147B] leading-none">{session.totalTags}</p>
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Thành công</p>
                             </div>
                             <button className="p-2.5 text-slate-300 hover:text-slate-800 hover:bg-white rounded-xl transition-all shadow-none border hover:shadow-sm border-transparent hover:border-slate-100">
                               <MoreVertical className="w-5 h-5" />
                             </button>
                          </div>
                        </div>
                        
                        {/* Expandable scan details could go here */}
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center space-y-3">
                       <Radio className="w-12 h-12 text-slate-200 mx-auto" />
                       <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Chưa có dữ liệu quét RFID</p>
                    </div>
                  )}
               </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-6 md:px-8 bg-white border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
             <ListChecks className="w-4 h-4" /> Dữ liệu được bảo mật bởi Riotex System
           </div>
           <button 
             onClick={onClose} 
             className="w-full md:w-auto px-8 py-3 bg-white border border-slate-200 text-slate-900 font-black rounded-2xl shadow-sm hover:bg-slate-50 hover:shadow-gray active:scale-95 transition-all text-sm uppercase tracking-wider"
           >
             Đóng tab điều hướng
           </button>
        </div>
      </div>
    </div>
  );
};

