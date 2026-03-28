import React from 'react';
import { PackageCheck, ArrowUpRight, Truck, AlertCircle, HelpCircle } from 'lucide-react';

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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6 mb-8">
      {stats.map((stat) => {
        const styles = getColorStyles(stat.colorScheme);
        const Icon = stat.icon;
        
        // Define what goes in the badge
        const badgeContent = stat.alertText || stat.trend;

        return (
          <div
            key={stat.id}
            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group"
          >
            {badgeContent && (
              <div className={`absolute top-6 right-6 px-2.5 py-1 ${styles.badgeColor} rounded-full text-[10px] font-black tracking-wider`}>
                {stat.trendUp && stat.trend === badgeContent ? '+' : ''}{badgeContent}
              </div>
            )}
            
            <div className={`w-12 h-12 rounded-2xl ${styles.iconColor} flex items-center justify-center mb-6`}>
              <Icon className="w-6 h-6 stroke-[1.5]" />
            </div>
            
            <div className="text-xs font-bold text-slate-500 mb-1 tracking-wide uppercase">{stat.label}</div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight">{stat.value}</div>
          </div>
        );
      })}
    </div>
  );
};
