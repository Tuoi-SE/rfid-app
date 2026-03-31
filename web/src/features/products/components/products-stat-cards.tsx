import { Package, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface ProductsStatCardsProps {
  totalProducts: number;
}

export const ProductsStatCards = ({ totalProducts }: ProductsStatCardsProps) => {
  const stats = [
    {
      label: 'Tổng Sản phẩm',
      value: totalProducts.toLocaleString(),
      badge: '+12%',
      badgeColor: 'text-emerald-600 bg-emerald-50',
      icon: Package,
      iconColor: 'text-[#04147B] bg-[#04147B]/10'
    },
    {
      label: 'Đã gán RFID',
      value: '98.2%',
      badge: 'Tốt',
      badgeColor: 'text-emerald-600 bg-emerald-50',
      icon: CheckCircle2,
      iconColor: 'text-[#04147B] bg-[#04147B]/10'
    },
    {
      label: 'Lỗi/Mất tín hiệu',
      value: '14 sản phẩm',
      badge: 'Cần kiểm tra',
      badgeColor: 'text-red-600 bg-red-50',
      icon: AlertCircle,
      iconColor: 'text-[#04147B] bg-[#04147B]/10'
    },
    {
      label: 'Cập nhật cuối',
      value: '2 phút trước',
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
