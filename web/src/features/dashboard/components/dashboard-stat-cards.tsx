import { Package, Tag, FolderOpen, Layers } from 'lucide-react';
import { DashboardSummaryResponse } from '../types';

interface DashboardStatCardsProps {
  stats?: DashboardSummaryResponse;
}

export const DashboardStatCards = ({ stats }: DashboardStatCardsProps) => {
  const formatGrowth = (growth: number | undefined) => {
    if (growth == null) return '—';
    if (growth === 0) return 'Không đổi';
    return growth > 0 ? `+${growth}%` : `${growth}%`;
  };

  const getBadgeColor = (growth: number | undefined) => {
    if (growth == null || growth === 0) return 'text-slate-500 bg-slate-100';
    if (growth > 0) return 'text-emerald-600 bg-emerald-50';
    return 'text-red-600 bg-red-50';
  };

  const topStats = [
    {
      label: 'Tổng Sản phẩm',
      value: stats?.total_products != null ? stats.total_products.toLocaleString() : '—',
      badge: formatGrowth(stats?.products_growth),
      badgeColor: getBadgeColor(stats?.products_growth),
      icon: Package,
      iconColor: 'text-primary bg-primary/10'
    },
    {
      label: 'Tổng Tags RFID',
      value: stats?.total_tags != null ? stats.total_tags.toLocaleString() : '—',
      badge: formatGrowth(stats?.tags_growth),
      badgeColor: getBadgeColor(stats?.tags_growth),
      icon: Tag,
      iconColor: 'text-primary bg-primary/10'
    },
    {
      label: 'Danh mục',
      value: stats?.total_categories != null ? stats.total_categories.toLocaleString() : '—',
      badge: formatGrowth(stats?.categories_growth),
      badgeColor: getBadgeColor(stats?.categories_growth),
      icon: FolderOpen,
      iconColor: 'text-primary bg-primary/10'
    },
    {
      label: 'Người dùng',
      value: stats?.total_users != null ? stats.total_users.toLocaleString() : '—',
      badge: formatGrowth(stats?.users_growth),
      badgeColor: getBadgeColor(stats?.users_growth),
      icon: Layers,
      iconColor: 'text-primary bg-primary/10'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 xl:gap-4 2xl:gap-6 mb-4 xl:mb-6 2xl:mb-8">
      {topStats.map((stat, i) => (
        <div key={i} className="bg-white rounded-2xl 2xl:rounded-3xl p-4 xl:p-5 2xl:p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className={`absolute top-4 right-4 2xl:top-6 2xl:right-6 px-2 py-0.5 2xl:px-2.5 2xl:py-1 ${stat.badgeColor} rounded-full text-[9px] 2xl:text-[10px] font-black tracking-wider`}>
            {stat.badge}
          </div>
          <div className={`w-9 h-9 xl:w-10 xl:h-10 2xl:w-12 2xl:h-12 rounded-xl 2xl:rounded-2xl ${stat.iconColor} flex items-center justify-center mb-3 xl:mb-4 2xl:mb-6`}>
            <stat.icon className="w-4 h-4 xl:w-5 xl:h-5 2xl:w-6 2xl:h-6 stroke-[1.5]" />
          </div>
          <div className="text-[10px] xl:text-[11px] 2xl:text-xs font-bold text-slate-500 mb-0.5 2xl:mb-1 line-clamp-1">{stat.label}</div>
          <div className="text-xl xl:text-2xl 2xl:text-3xl font-bold text-slate-900 tracking-tight">{stat.value}</div>
        </div>
      ))}
    </div>
  );
};
