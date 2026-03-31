import { Package, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

import { Product } from '../types';

interface ProductsStatCardsProps {
  products: Product[];
}

export const ProductsStatCards = ({ products }: ProductsStatCardsProps) => {
  const totalProducts = products.length;
  const assignedCount = products.filter(p => (p._count?.tags || 0) > 0).length;
  // Prevent division by zero
  const assignedPercent = totalProducts > 0 ? ((assignedCount / totalProducts) * 100).toFixed(1) + '%' : '0%';
  
  // Real-time: find latest updated or created product
  const latestDate = products.reduce((latest, current) => {
    const currentObj = current as any;
    const itemDate = new Date(currentObj.updatedAt || current.createdAt).getTime();
    return itemDate > latest ? itemDate : latest;
  }, 0);

  // Simple relative time display
  const getRelativeTime = (timestamp: number) => {
    if (!timestamp) return 'Chưa có';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Vừa xong';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
    return new Date(timestamp).toLocaleDateString('vi-VN');
  };

  const lastUpdateStr = getRelativeTime(latestDate);
  const newlyCreatedCount = products.filter(p => {
    const pDate = (p as any).updatedAt || p.createdAt;
    return (Date.now() - new Date(pDate).getTime()) < 86400 * 1000;
  }).length;

  const stats = [
    {
      label: 'Tổng Sản phẩm',
      value: totalProducts.toLocaleString(),
      badge: newlyCreatedCount > 0 ? `+${newlyCreatedCount} hôm nay` : null,
      badgeColor: 'text-emerald-600 bg-emerald-50',
      icon: Package,
      iconColor: 'text-[#04147B] bg-[#04147B]/10'
    },
    {
      label: 'Đã gán RFID',
      value: assignedPercent,
      badge: assignedCount === totalProducts && totalProducts > 0 ? 'Hoàn hảo' : 'Tốt',
      badgeColor: 'text-emerald-600 bg-emerald-50',
      icon: CheckCircle2,
      iconColor: 'text-[#04147B] bg-[#04147B]/10'
    },
    {
      label: 'Số lượng Thẻ Đã Gán',
      value: products.reduce((acc, p) => acc + (p._count?.tags || 0), 0) + ' chiếc',
      badge: 'Kho',
      badgeColor: 'text-indigo-600 bg-indigo-50',
      icon: Package,
      iconColor: 'text-[#04147B] bg-[#04147B]/10'
    },
    {
      label: 'Cập nhật cuối',
      value: lastUpdateStr,
      badge: null,
      badgeColor: '',
      icon: RefreshCw,
      iconColor: 'text-[#04147B] bg-[#04147B]/10'
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
