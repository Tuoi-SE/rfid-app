import { AlertCircle, CheckCircle2, ClipboardList, Loader2, Shapes } from 'lucide-react';
import { useCategoriesStats } from '../hooks/use-categories-stats';

export const CategoriesStatCards = () => {
  const { data: statsData, isLoading } = useCategoriesStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 h-[140px] animate-pulse flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-slate-200 animate-spin" />
          </div>
        ))}
      </div>
    );
  }

  const {
    totalCategories = 0,
    activeCategories = 0,
    totalProducts = 0,
    emptyCategories = 0,
    growth = 0
  } = statsData || {};

  const formatGrowth = (val: number) => {
    if (val === 0) return '0%';
    return val > 0 ? `+${val}%` : `${val}%`;
  };

  const getBadgeColor = (val: number) => {
    if (val === 0) return 'text-slate-500 bg-slate-100';
    if (val > 0) return 'text-emerald-600 bg-emerald-50';
    return 'text-red-600 bg-red-50';
  };

  const stats = [
    {
      label: 'Tổng Danh mục',
      value: totalCategories.toLocaleString(),
      badge: formatGrowth(growth),
      badgeColor: getBadgeColor(growth),
      icon: Shapes,
      iconColor: 'text-primary bg-primary/10'
    },
    {
      label: 'Đang Hoạt động',
      value: activeCategories.toLocaleString(),
      badge: totalCategories > 0 ? `${Math.round((activeCategories / totalCategories) * 100)}%` : '0%',
      badgeColor: 'text-emerald-600 bg-emerald-50',
      icon: CheckCircle2,
      iconColor: 'text-primary bg-primary/10'
    },
    {
      label: 'SP Đã Phân loại',
      value: totalProducts.toLocaleString(),
      badge: null,
      badgeColor: 'text-emerald-600 bg-emerald-50',
      icon: ClipboardList,
      iconColor: 'text-primary bg-primary/10'
    },
    {
      label: 'Danh mục Trống',
      value: emptyCategories.toLocaleString(),
      badge: emptyCategories > 0 ? 'Cần dọn' : 'Tốt',
      badgeColor: 'text-emerald-600 bg-emerald-50',
      icon: AlertCircle,
      iconColor: 'text-primary bg-primary/10'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 xl:gap-4 2xl:gap-6 mb-4 xl:mb-6 2xl:mb-8">
      {stats.map((stat, i) => (
        <div key={i} className="bg-white rounded-2xl 2xl:rounded-3xl p-4 xl:p-5 2xl:p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
          {stat.badge && (
            <div className={`absolute top-4 right-4 2xl:top-6 2xl:right-6 px-2 py-0.5 2xl:px-2.5 2xl:py-1 ${stat.badgeColor} rounded-full text-[9px] 2xl:text-[10px] font-black tracking-wider`}>
              {stat.badge}
            </div>
          )}
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
