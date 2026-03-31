import { Hash, ClipboardCheck, AlertCircle, ScanBarcode, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

interface TagsStatCardsProps {
  totalTags: number;
  inStock: number;
  missing: number;
  active24h: number;
}

export const TagsStatCards = ({ totalTags, inStock, missing, active24h }: TagsStatCardsProps) => {
  const inStockPercent = totalTags > 0 ? ((inStock / totalTags) * 100).toFixed(1) + '%' : '0%';

  const stats = [
    {
      label: 'Tổng Tags',
      value: totalTags.toLocaleString(),
      badge: null,
      badgeColor: 'text-emerald-600 bg-emerald-50',
      icon: Hash,
      iconColor: 'text-[#04147B] bg-[#04147B]/10'
    },
    {
      label: 'Trong kho',
      value: inStock.toLocaleString(),
      badge: inStockPercent,
      badgeColor: 'text-emerald-600 bg-emerald-50',
      icon: ClipboardCheck,
      iconColor: 'text-[#04147B] bg-[#04147B]/10'
    },
    {
      label: 'Thiếu (Missing)',
      value: missing.toLocaleString(),
      badge: missing > 0 ? 'Cần kiểm tra' : 'Tốt',
      badgeColor: missing > 0 ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50',
      icon: AlertCircle,
      iconColor: missing > 0 ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50'
    },
    {
      label: 'Hoạt động (24H)',
      value: active24h.toLocaleString(),
      badge: 'PULSE',
      badgeColor: 'text-amber-600 bg-amber-50',
      icon: Activity,
      iconColor: 'text-[#04147B] bg-[#04147B]/10',
      hasAction: true
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
          <div className="text-[10px] xl:text-[11px] 2xl:text-xs font-bold text-slate-500 mb-0.5 2xl:mb-1 tracking-wide uppercase line-clamp-1">{stat.label}</div>
          <div className="text-xl xl:text-2xl 2xl:text-3xl font-bold text-slate-900 tracking-tight">{stat.value}</div>

          {/* Nút hành động nổi sát với design cũ */}
          {stat.hasAction && (
            <button
              className="absolute bottom-4 right-4 2xl:bottom-6 2xl:right-6 w-8 h-8 xl:w-9 xl:h-9 2xl:w-10 2xl:h-10 bg-[#04147B] text-white rounded-xl 2xl:rounded-[14px] flex items-center justify-center shadow-lg shadow-blue-900/20 transform transition-all hover:scale-105 active:scale-95 group/btn border border-transparent hover:border-blue-400"
              title="Quét Tag Mới"
              onClick={() => toast('Sẽ mở Modal quét máy đọc RFID', { icon: '🚧' })}
            >
              <ScanBarcode className="w-4 h-4 xl:w-4 xl:h-4 2xl:w-5 2xl:h-5 text-blue-200 group-hover/btn:text-white transition-colors" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
