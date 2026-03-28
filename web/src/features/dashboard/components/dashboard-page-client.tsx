'use client';
import { useQuery } from '@tanstack/react-query';
import { httpClient } from '@/lib/http/client';
import { Package, Tag, FolderOpen, Layers, Disc, Activity, Plus, ArrowUp } from 'lucide-react';

export default function DashboardPageClient() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => httpClient('/dashboard/summary'),
  });

  console.log('🔍 Dashboard API response:', JSON.stringify(stats, null, 2));

  const topStats = [
    { label: 'Tổng Sản phẩm', value: stats?.totalProducts != null ? stats.totalProducts.toLocaleString() : '1,240', badge: '+12%', badgeColor: 'text-emerald-600 bg-emerald-50', icon: Package, iconColor: 'text-primary bg-primary/10' },
    { label: 'Tổng Tags RFID', value: stats?.totalTags != null ? stats.totalTags.toLocaleString() : '12,450', badge: '+5.2k', badgeColor: 'text-emerald-600 bg-emerald-50', icon: Tag, iconColor: 'text-indigo-600 bg-indigo-50/50' },
    { label: 'Danh mục', value: stats?.totalCategories != null ? stats.totalCategories.toLocaleString() : '24', badge: 'ỔN ĐỊNH', badgeColor: 'text-slate-400 bg-slate-100', icon: FolderOpen, iconColor: 'text-slate-600 bg-slate-50' },
    { label: 'Người dùng', value: stats?.totalUsers != null ? stats.totalUsers.toLocaleString() : '15', badge: '3 Online', badgeColor: 'text-primary bg-primary/10', icon: Layers, iconColor: 'text-primary bg-primary/10' },
  ];

  const statusCards = [
    { label: 'TRONG KHO', value: stats?.tagsByStatus?.IN_STOCK != null ? stats.tagsByStatus.IN_STOCK.toLocaleString() : '8,450', dot: 'bg-emerald-500', bar: 'bg-emerald-500', barWidth: 'w-2/3', lightBar: 'bg-emerald-50' },
    { label: 'ĐÃ XUẤT', value: stats?.tagsByStatus?.OUT_OF_STOCK != null ? stats.tagsByStatus.OUT_OF_STOCK.toLocaleString() : '3,200', dot: 'bg-red-500', bar: 'bg-red-500', barWidth: 'w-1/3', lightBar: 'bg-red-50' },
    { label: 'ĐANG VẬN CHUYỂN', value: stats?.tagsByStatus?.IN_TRANSIT != null ? stats.tagsByStatus.IN_TRANSIT.toLocaleString() : '800', dot: 'bg-blue-600', bar: 'bg-blue-600', barWidth: 'w-1/6', lightBar: 'bg-blue-50' },
  ];

  // Activities Mock to match Figma
  const activities = [
    { user: 'admin', bold: 'tạo phiếu', id: 'ORD-2026-001', desc: 'Hệ thống kho chính - Cơ sở 1', time: '2 phút trước', color: 'text-primary bg-primary/10 border-primary', icon: Plus },
    { user: 'Nhân viên kho A', bold: 'hoàn thành', id: 'Session 123', desc: '452 thẻ RFID đã được xác nhận', time: '45 phút trước', color: 'text-emerald-500 bg-emerald-50 border-emerald-500', icon: Disc },
    { user: 'Lô hàng #9920', bold: 'đang được chuyển đến', id: 'Vùng 2', desc: '', time: '1 giờ trước', color: 'text-amber-500 bg-amber-50 border-amber-500', icon: ArrowUp },
    { user: 'Phát hiện 5 tags', bold: 'không rõ nguồn gốc tại', id: 'Gateway 4', desc: '', time: '3 giờ trước', color: 'text-red-500 bg-red-50 border-red-500', icon: Disc },
  ];

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen -m-8 p-8 relative">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight leading-tight">Dashboard Tổng quan</h1>
          <p className="text-sm text-slate-500 mt-1">Theo dõi tình trạng kho hàng và thẻ RFID thời gian thực</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100/50 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-[pulse_2s_ease-in-out_infinite]"></div>
          <span className="text-xs font-bold tracking-wide">HỆ THỐNG HOẠT ĐỘNG BÌNH THƯỜNG</span>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {topStats.map((stat, i) => (
          <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className={`absolute top-6 right-6 px-2.5 py-1 ${stat.badgeColor} rounded-full text-[10px] font-black tracking-wider`}>
              {stat.badge}
            </div>
            <div className={`w-12 h-12 rounded-2xl ${stat.iconColor} flex items-center justify-center mb-6`}>
              <stat.icon className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div className="text-xs font-bold text-slate-500 mb-1">{stat.label}</div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-24">
        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-8">

          {/* Trạng thái Tags */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Disc className="w-5 h-5 text-primary stroke-[2.5]" />
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">Trạng thái Tags RFID</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {statusCards.map((card, i) => (
                <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between h-[140px]">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${card.dot}`}></span>
                    <span className="text-[10px] font-black text-slate-500 tracking-widest leading-none mt-0.5">{card.label}</span>
                  </div>
                  <div>
                    <div className="text-[34px] font-medium text-slate-800 tracking-tight leading-none mb-4">{card.value}</div>
                    <div className={`w-full h-1.5 ${card.lightBar} rounded-full overflow-hidden`}>
                      <div className={`h-full ${card.bar} ${card.barWidth} rounded-full`}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Biểu đồ biến động */}
          <section>
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-10">
                <h3 className="font-bold text-slate-800">Biến động tồn kho tuần qua</h3>
                <div className="flex items-center bg-slate-50 p-1 rounded-full border border-slate-100">
                  <button className="px-5 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 rounded-full transition-colors">Ngày</button>
                  <button className="px-5 py-1.5 text-xs font-bold bg-primary text-white rounded-full shadow-sm">Tuần</button>
                </div>
              </div>
              <div className="h-48 flex items-end justify-between gap-4 px-2">
                {/* CSS Bar Chart Mockup */}
                <div className="w-full bg-[#EEF2FF] rounded-t-xl h-24 hover:bg-primary/20 transition-colors"></div>
                <div className="w-full bg-[#EEF2FF] rounded-t-xl h-32 hover:bg-primary/20 transition-colors"></div>
                <div className="w-full bg-[#C7D2FE] rounded-t-xl h-20 hover:bg-primary/30 transition-colors"></div>
                <div className="w-full bg-primary rounded-t-xl h-40 shadow-lg relative"></div>
                <div className="w-full bg-[#C7D2FE] rounded-t-xl h-28 hover:bg-primary/30 transition-colors"></div>
                <div className="w-full bg-[#EEF2FF] rounded-t-xl h-20 hover:bg-primary/20 transition-colors"></div>
                <div className="w-full bg-[#EEF2FF] rounded-t-xl h-28 hover:bg-primary/20 transition-colors"></div>
              </div>
            </div>
          </section>

        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 flex flex-col gap-8">

          {/* Hoạt động gần đây */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-primary stroke-[2.5]" />
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">Hoạt động gần đây</h2>
            </div>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 relative">
              <div className="space-y-6">
                {activities.map((act, i) => (
                  <div key={i} className="flex gap-4 relative">
                    {/* Vertical line indicator */}
                    {i !== activities.length - 1 && (
                      <div className="absolute left-3.5 top-8 w-px h-10 bg-slate-100"></div>
                    )}
                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-white ${act.color}`}>
                      <act.icon className="w-3.5 h-3.5 stroke-3" />
                    </div>
                    <div className="flex-1 pb-1">
                      <div className="flex justify-between items-start mb-0.5">
                        <p className="text-[13px] text-slate-800 leading-snug">
                          <span className="font-bold">{act.user}</span> {act.bold} <span className="font-bold text-primary bg-primary/5 px-1 rounded">{act.id}</span>
                        </p>
                        <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap ml-2 leading-snug text-right w-8">{act.time.replace(' trước', '\ntrước')}</span>
                      </div>
                      {act.desc && <p className="text-[11px] text-slate-500 font-medium">{act.desc}</p>}
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-3.5 rounded-2xl border border-slate-100 text-xs font-bold text-primary hover:bg-[#F8FAFC] transition-colors tracking-wide">
                XEM TẤT CẢ HOẠT ĐỘNG →
              </button>
            </div>
          </section>

          {/* Image Card Widget */}
          <section className="mt-auto">
            <div className="w-full aspect-video rounded-3xl bg-slate-800 relative overflow-hidden shadow-lg group cursor-pointer">
              <img
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1000&auto=format&fit=crop"
                alt="Warehouse"
                className="w-full h-full object-cover opacity-60 group-hover:opacity-75 group-hover:scale-105 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-colors">
                <Plus className="w-4 h-4" />
              </div>
              <div className="absolute bottom-4 left-5 right-5">
                <h3 className="text-white font-bold text-sm mb-0.5 shadow-sm">Kho trung tâm (Hà Nội)</h3>
                <p className="text-white/80 text-[11px] font-medium flex items-center gap-2">
                  <span>Sức chứa: 85%</span>
                  <span className="w-1 h-1 rounded-full bg-white/50"></span>
                  <span>Nhiệt độ: 24°C</span>
                </p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
