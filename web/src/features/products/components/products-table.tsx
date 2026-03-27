import { Pencil, Trash2 } from 'lucide-react';
import { Product } from '../types';

interface ProductsTableProps {
  products: Product[];
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
}

export function ProductsTable({ products, onEdit, onDelete }: ProductsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            <th className="text-left px-5 py-3 font-medium text-slate-500">Sản phẩm</th>
            <th className="text-left px-5 py-3 font-medium text-slate-500">SKU</th>
            <th className="text-left px-5 py-3 font-medium text-slate-500">Danh mục</th>
            <th className="text-center px-5 py-3 font-medium text-slate-500">Tags</th>
            <th className="text-right px-5 py-3 font-medium text-slate-500">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-5 py-3.5">
                <div className="font-medium text-slate-800">{p.name}</div>
                {p.description && <div className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{p.description}</div>}
              </td>
              <td className="px-5 py-3.5">
                <code className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-mono">{p.sku}</code>
              </td>
              <td className="px-5 py-3.5">
                <span className="inline-flex items-center bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
                  {p.category?.name || '—'}
                </span>
              </td>
              <td className="px-5 py-3.5 text-center">
                <span className="inline-flex items-center bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full text-xs font-medium">
                  {p._count?.tags ?? 0}
                </span>
              </td>
              <td className="px-5 py-3.5 text-right">
                <div className="flex items-center justify-end gap-1 relative z-20">
                  <button onClick={() => onEdit(p)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-indigo-600" title="Sửa">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(p.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-600" title="Xoá">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
