import { Pencil, Trash2, Package, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Product } from '../types';
import { Pagination } from '@/components/Pagination';

interface ProductsTableProps {
  products: Product[];
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onSelectAll?: () => void;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  sortConfig?: { key: keyof Product | string | any; direction: 'asc' | 'desc' } | null;
  onSort?: (key: string) => void;
}

export const ProductsTable = ({ 
  products, 
  selectedIds = [], 
  onToggleSelect = () => {}, 
  onSelectAll = () => {}, 
  onEdit, 
  onDelete,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange = () => {},
  sortConfig,
  onSort
}: ProductsTableProps) => {
  if (products.length === 0) return null;

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
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto bg-white rounded-[20px] border border-slate-100 shadow-sm mb-4 xl:mb-6">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-white shadow-sm border-b border-slate-100">
            <tr>
              <th className="px-5 py-4 w-12 text-center text-slate-300">
                <input 
                  type="checkbox" 
                  checked={products.length > 0 && selectedIds.length === products.length}
                  onChange={onSelectAll}
                  className="w-4 h-4 rounded border-slate-200 text-[#04147B] focus:ring-[#04147B]/20 cursor-pointer" 
                />
              </th>
              {renderSortableHeader('Tên sản phẩm', 'name')}
              {renderSortableHeader('SKU', 'sku')}
              {renderSortableHeader('Danh mục', 'categoryId')}
              {renderSortableHeader('Số thẻ RFID', 'rfidCount', 'center')}

              <th className="text-right px-5 py-4 font-black text-[11px] text-slate-500 tracking-widest uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {products.map((p, i) => {
              // Mock dynamic UI details
              const tagCount = p._count?.tags ?? (i % 2 === 0 ? 42 : 19);
              


              return (
                <tr key={p.id} className={`hover:bg-slate-50/50 transition-colors group ${selectedIds.includes(p.id) ? 'bg-[#04147B]/5' : ''}`}>
                  <td className="px-5 py-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(p.id)}
                      onChange={() => onToggleSelect(p.id)}
                      className="w-4 h-4 rounded border-slate-200 text-[#04147B] focus:ring-[#04147B]/20 cursor-pointer" 
                    />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#04147B]/5 flex items-center justify-center shrink-0 overflow-hidden">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-[#04147B]" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-[14px] leading-tight mb-1">{p.name}</div>
                        <div className="text-[10px] font-black text-slate-400 font-mono tracking-widest max-w-[150px] truncate">{p.description || '—'}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-5 py-4">
                    <span className="inline-flex px-3 py-1 bg-[#F4F7FB] text-slate-600 text-[11px] font-bold rounded-lg font-mono tracking-wide">
                      {p.sku}
                    </span>
                  </td>
                  
                  <td className="px-5 py-4 text-slate-500 font-medium">
                    {p.category?.name || '—'}
                  </td>
                  
                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-xs font-bold w-12">
                      {tagCount}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onEdit(p)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-[#04147B]" title="Sửa">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDelete(p.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-600" title="Xoá">
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

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={onPageChange}
        itemName="sản phẩm"
      />
    </div>
  );
};
