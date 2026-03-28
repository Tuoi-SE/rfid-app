import { Hash, ClipboardCheck, AlertCircle, ScanBarcode, Activity } from 'lucide-react';

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, i) => (
        <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
          {stat.badge && (
            <div className={`absolute top-6 right-6 px-2.5 py-1 ${stat.badgeColor} rounded-full text-[10px] font-black tracking-wider`}>
              {stat.badge}
            </div>
          )}
          <div className={`w-12 h-12 rounded-2xl ${stat.iconColor} flex items-center justify-center mb-6`}>
            <stat.icon className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div className="text-xs font-bold text-slate-500 mb-1 tracking-wide uppercase">{stat.label}</div>
          <div className="text-3xl font-bold text-slate-900 tracking-tight">{stat.value}</div>

          {/* Nút hành động nổi sát với design cũ */}
          {stat.hasAction && (
            <button
              className="absolute bottom-6 right-6 w-10 h-10 bg-[#04147B] text-white rounded-[14px] flex items-center justify-center shadow-lg shadow-blue-900/20 transform transition-all hover:scale-105 active:scale-95 group/btn border border-transparent hover:border-blue-400"
              title="Quét Tag Mới"
              onClick={() => alert('Sẽ mở Modal quét máy đọc RFID')}
            >
              <ScanBarcode className="w-5 h-5 text-blue-200 group-hover/btn:text-white transition-colors" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
