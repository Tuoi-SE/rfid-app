import React from 'react';

export interface InventoryStat {
  id: string;
  label: string;
  value: string | number;
  icon: React.ElementType;
  colorScheme: 'green' | 'slate' | 'indigo' | 'red' | 'gray';
  trend?: string;
  trendUp?: boolean;
  alertText?: string;
}

interface InventoryStatCardsProps {
  stats: InventoryStat[];
}

export const InventoryStatCards = ({ stats }: InventoryStatCardsProps) => {
  const xlGridColsClass =
    stats.length >= 7 ? 'xl:grid-cols-7' : stats.length >= 6 ? 'xl:grid-cols-6' : 'xl:grid-cols-5';

  const getColorStyles = (scheme: string) => {
    switch (scheme) {
      case 'green':
        return {
          badgeColor: 'text-emerald-600 bg-emerald-50',
          iconColor: 'text-emerald-600 bg-emerald-50'
        };
      case 'slate':
        return {
          badgeColor: 'text-slate-600 bg-slate-100',
          iconColor: 'text-slate-600 bg-slate-100'
        };
      case 'indigo':
        return {
          badgeColor: 'text-[#04147B] bg-[#04147B]/10',
          iconColor: 'text-[#04147B] bg-[#04147B]/10'
        };
      case 'red':
        return {
          badgeColor: 'text-red-600 bg-red-50',
          iconColor: 'text-red-600 bg-red-50'
        };
      case 'gray':
      default:
        return {
          badgeColor: 'text-slate-500 bg-slate-50',
          iconColor: 'text-slate-400 bg-slate-50'
        };
    }
  };

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${xlGridColsClass} gap-3 xl:gap-4 2xl:gap-6 mb-4 xl:mb-6 2xl:mb-8`}>
      {stats.map((stat) => {
        const styles = getColorStyles(stat.colorScheme);
        const Icon = stat.icon;
        
        // Define what goes in the badge
        const badgeContent = stat.alertText || stat.trend;

        return (
          <div
            key={stat.id}
            className="bg-white rounded-2xl 2xl:rounded-3xl p-4 xl:p-5 2xl:p-6 border border-slate-100 shadow-sm relative overflow-hidden group"
          >
            {badgeContent && (
              <div className={`absolute top-4 right-4 2xl:top-6 2xl:right-6 px-2 py-0.5 2xl:px-2.5 2xl:py-1 ${styles.badgeColor} rounded-full text-[9px] 2xl:text-[10px] font-black tracking-wider`}>
                {stat.trendUp && stat.trend === badgeContent ? '+' : ''}{badgeContent}
              </div>
            )}
            
            <div className={`w-9 h-9 xl:w-10 xl:h-10 2xl:w-12 2xl:h-12 rounded-xl 2xl:rounded-2xl ${styles.iconColor} flex items-center justify-center mb-3 xl:mb-4 2xl:mb-6`}>
              <Icon className="w-4 h-4 xl:w-5 xl:h-5 2xl:w-6 2xl:h-6 stroke-[1.5]" />
            </div>
            
            <div className="text-[10px] xl:text-[11px] 2xl:text-xs font-bold text-slate-500 mb-0.5 2xl:mb-1 tracking-wide uppercase line-clamp-1">{stat.label}</div>
            <div className="text-xl xl:text-2xl 2xl:text-3xl font-bold text-slate-900 tracking-tight">{stat.value}</div>
          </div>
        );
      })}
    </div>
  );
};
