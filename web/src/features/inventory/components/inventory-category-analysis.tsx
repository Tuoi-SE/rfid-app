import React from 'react';
import { Shirt, BoxSelect, Footprints } from 'lucide-react';

export interface CategoryStat {
  id: string;
  name: string;
  totalProducts: number;
  inStockPercent: number;
  inStockUnits: string; // e.g. "3,570 ĐƠN VỊ"
  colorTheme: 'blue' | 'indigo' | 'green';
  icon: React.ElementType;
}

interface InventoryCategoryAnalysisProps {
  categories: CategoryStat[];
  onViewAll?: () => void;
}

export const InventoryCategoryAnalysis = ({ categories, onViewAll }: InventoryCategoryAnalysisProps) => {
  const getThemeStyles = (theme: string) => {
    switch (theme) {
      case 'indigo':
        return {
          barBg: 'bg-indigo-50',
          barFill: 'bg-gradient-to-r from-indigo-600 to-indigo-400',
          textVal: 'text-indigo-700',
        };
      case 'green':
        return {
          barBg: 'bg-emerald-50',
          barFill: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
          textVal: 'text-emerald-600',
        };
      case 'blue':
      default:
        return {
          barBg: 'bg-[#04147B]/5',
          barFill: 'bg-gradient-to-r from-[#04147B] to-blue-600',
          textVal: 'text-[#04147B]',
        };
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-[18px] font-bold text-slate-800 tracking-tight">Phân tích Danh mục</h2>
        <button 
          onClick={onViewAll}
          className="text-[13px] font-bold text-[#04147B] hover:text-[#030e57] hover:underline underline-offset-4 decoration-2"
        >
          Xem tất cả báo cáo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const theme = getThemeStyles(cat.colorTheme);
          const Icon = cat.icon;

          return (
            <div 
              key={cat.id}
              className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 relative overflow-hidden group"
            >
              {/* Background large icon faded */}
              <div className="absolute -right-6 -top-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-300 pointer-events-none">
                <Icon className="w-36 h-36 text-slate-900" strokeWidth={1.5} />
              </div>

              <div className="relative z-10">
                <div className="mb-8">
                  <h3 className="text-[18px] font-bold text-slate-800 mb-1">{cat.name}</h3>
                  <p className="text-[14px] text-slate-500 font-medium">{cat.totalProducts.toLocaleString()} sản phẩm tổng cộng</p>
                </div>

                <div className="space-y-3 relative z-10">
                  <div className="flex justify-between items-end">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      Trong kho: {cat.inStockPercent}%
                    </span>
                    <span className={`text-[12px] font-bold ${theme.textVal}`}>
                      {cat.inStockUnits}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className={`h-2.5 w-full rounded-full overflow-hidden ${theme.barBg}`}>
                    <div 
                      className={`h-full rounded-full ${theme.barFill} transition-all duration-1000 ease-out`}
                      style={{ width: `${cat.inStockPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
