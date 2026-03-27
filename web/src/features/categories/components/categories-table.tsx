import { FolderTree, Pencil, Trash2 } from 'lucide-react';
import { Category } from '../types';

interface CategoriesTableProps {
  categories: Category[];
  onEdit: (cat: Category) => void;
  onDelete: (id: string) => void;
}

export function CategoriesTable({ categories, onEdit, onDelete }: CategoriesTableProps) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            <th className="text-left px-5 py-3 font-medium text-slate-500">Tên danh mục</th>
            <th className="text-left px-5 py-3 font-medium text-slate-500">Mô tả</th>
            <th className="text-center px-5 py-3 font-medium text-slate-500">Sản phẩm</th>
            <th className="text-right px-5 py-3 font-medium text-slate-500">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {categories.map((cat) => (
            <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-5 py-3.5 font-medium text-slate-800">{cat.name}</td>
              <td className="px-5 py-3.5 text-slate-500 max-w-xs truncate">{cat.description || '—'}</td>
              <td className="px-5 py-3.5 text-center">
                <span className="inline-flex items-center bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full text-xs font-medium">
                  {cat._count?.products ?? 0}
                </span>
              </td>
              <td className="px-5 py-3.5 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button onClick={() => onEdit(cat)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-indigo-600" title="Sửa">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(cat.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-600" title="Xoá">
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
