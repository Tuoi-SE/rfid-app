'use client';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Tag, Layers, Activity, Package, FolderTree, ArrowLeftRight } from 'lucide-react';

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => apiClient('/dashboard/summary'),
  });

  const statCards = [
    { label: 'Tổng Sản phẩm', value: stats?.totalProducts ?? 0, icon: Package, color: 'bg-blue-500/10 text-blue-500' },
    { label: 'Tổng Tags', value: stats?.totalTags ?? 0, icon: Tag, color: 'bg-emerald-500/10 text-emerald-500' },
    { label: 'Danh mục', value: stats?.totalCategories ?? 0, icon: FolderTree, color: 'bg-amber-500/10 text-amber-500' },
    { label: 'Người dùng', value: stats?.totalUsers ?? 0, icon: Layers, color: 'bg-indigo-500/10 text-indigo-500' },
  ];

  const tagStatusCards = [
    { label: 'Trong kho', value: stats?.tagsByStatus?.IN_STOCK ?? 0, dotColor: 'bg-green-500' },
    { label: 'Xuất kho', value: stats?.tagsByStatus?.OUT_OF_STOCK ?? 0, dotColor: 'bg-red-500' },
    { label: 'Đang vận chuyển', value: stats?.tagsByStatus?.IN_TRANSIT ?? 0, dotColor: 'bg-yellow-500' },
  ];

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold text-slate-800 mb-1">Tổng quan</h1>
      <p className="text-slate-500 mb-8">Theo dõi tình trạng kho hàng RFID theo thời gian thực</p>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white p-6 rounded-xl border border-slate-100 animate-pulse h-28" />
          ))}
        </div>
      ) : (
        <>
          {/* Main Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
            {statCards.map(card => (
              <div key={card.label} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className={`p-3.5 rounded-xl ${card.color}`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{card.label}</div>
                  <div className="text-2xl font-bold text-slate-800 mt-0.5">{card.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Tag Status */}
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-slate-400" />
            Trạng thái Tags
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {tagStatusCards.map(card => (
              <div key={card.label} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${card.dotColor}`} />
                  <span className="text-sm text-slate-500">{card.label}</span>
                </div>
                <div className="text-3xl font-bold text-slate-800">{card.value}</div>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          {stats?.recentActivity?.length > 0 && (
            <>
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-slate-400" />
                Hoạt động gần đây
              </h2>
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm divide-y divide-slate-50">
                {stats.recentActivity.slice(0, 8).map((log: any, i: number) => (
                  <div key={i} className="px-5 py-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span className="text-slate-700 font-medium">{log.action}</span>
                      <span className="text-slate-400">—</span>
                      <span className="text-slate-500">{log.entity}</span>
                    </div>
                    <span className="text-slate-400 text-xs">
                      {new Date(log.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* System Status */}
          <div className="mt-8 bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-slate-700">Hệ thống hoạt động bình thường</span>
            <span className="text-xs text-slate-400 ml-auto">Backend: localhost:3000</span>
          </div>
        </>
      )}
    </div>
  );
}
