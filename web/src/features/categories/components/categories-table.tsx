import { Shirt, Footprints, Watch, ShoppingBag, Pencil, Trash2, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Category } from '../types';
import { Pagination } from '@/components/Pagination';

interface CategoriesTableProps {
  categories: Category[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onEdit: (cat: Category) => void;
  onDelete: (id: string) => void;
  sortConfig?: { key: keyof Category | string | any; direction: 'asc' | 'desc' } | null;
  onSort?: (key: string) => void;
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

export const CategoriesTable = ({ 
  categories, 
  selectedIds, 
  onToggleSelect, 
  onSelectAll, 
  onEdit, 
  onDelete,
  sortConfig,
  onSort,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange = () => {}
}: CategoriesTableProps) => {
if (categories.length === 0) {
return null;
}


  
  // Fake functions for dummy data
  const getIconForIndex = (i: number) => {
    const icons = [Shirt, Shirt, Footprints, Watch, ShoppingBag];
    const IconComponent = icons[i % icons.length];
    return <IconComponent className="w-5 h-5 text-[#04147B]" />;
  };


  const renderSortableHeader = (label: string, sortKey: string, align: 'left' | 'center' | 'right' = 'left') => {
    const isActive = sortConfig?.key === sortKey;
    return (
      <th 
        className={`px-5 py-4 font-black text-[11px] text-slate-500 tracking-widest uppercase cursor-pointer hover:bg-slate-50 transition-colors group`}
        onClick={() => onSort && onSort(sortKey)}
      >
        <div className={`flex items-center gap-1.5 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'}`}>
          <span className={isActive ? 'text-[#04147B]' : ''}>{label}</span>
          {isActive ? (
            sortConfig.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-[#04147B]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#04147B]" />
          ) : (
            <ChevronsUpDown className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </th>
    );
  };

  return (
    <>
      <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-5 py-4 w-12 text-center text-slate-300">
                <input 
                  type="checkbox" 
                  checked={categories.length > 0 && selectedIds.length === categories.length}
                  onChange={onSelectAll}
                  className="w-4 h-4 rounded border-slate-200 text-[#04147B] focus:ring-[#04147B]/20 cursor-pointer" 
                />
              </th>
              {renderSortableHeader('Tên danh mục', 'name')}
              {renderSortableHeader('Mô tả', 'description')}
              {renderSortableHeader('Số sản phẩm', 'productsCount', 'center')}

              <th className="text-right px-5 py-4 font-black text-[11px] text-slate-500 tracking-widest uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {categories.map((cat, i) => {
              return (
                <tr key={cat.id} className={`hover:bg-slate-50/50 transition-colors group ${selectedIds.includes(cat.id) ? 'bg-[#04147B]/5' : ''}`}>
                  <td className="px-5 py-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(cat.id)}
                      onChange={() => onToggleSelect(cat.id)}
                      className="w-4 h-4 rounded border-slate-200 text-[#04147B] focus:ring-[#04147B]/20 cursor-pointer" 
                    />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#04147B]/5 flex items-center justify-center shrink-0">
                        {getIconForIndex(i)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-[14px] leading-tight mb-1">{cat.name}</div>
                        <div className="text-[10px] font-black text-slate-400 font-mono tracking-widest">CAT-00{i+1}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-500 font-medium max-w-xs truncate">{cat.description || '—'}</td>
                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-xs font-bold w-12">
                      {cat._count?.products ?? 0}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onEdit(cat)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-[#04147B]" title="Sửa">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDelete(cat.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-600" title="Xoá">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={onPageChange}
        itemName="kết quả"
      />
    </>
  );
};
