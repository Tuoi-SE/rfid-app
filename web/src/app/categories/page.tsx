'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { FolderTree, Plus, Pencil, Trash2, Search, X, Loader2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string | null;
  _count?: { products: number };
  createdAt: string;
}

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['categories', search],
    queryFn: () => api.getCategories(search ? `search=${search}` : ''),
  });

  const categories: Category[] = data?.data ?? data ?? [];

  const createMutation = useMutation({
    mutationFn: (d: any) => api.createCategory(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); closeForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: d }: any) => api.updateCategory(id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); closeForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteCategory(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); setDeleteId(null); },
  });

  const openCreate = () => {
    setEditItem(null);
    setFormData({ name: '', description: '' });
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditItem(cat);
    setFormData({ name: cat.name, description: cat.description || '' });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditItem(null);
    setFormData({ name: '', description: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-amber-500" />
            Danh mục sản phẩm
          </h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý các danh mục trong kho hàng</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Thêm danh mục
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm kiếm danh mục..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all bg-white"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-100">
          <FolderTree className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Chưa có danh mục nào</p>
          <button onClick={openCreate} className="text-indigo-600 text-sm mt-2 hover:underline">Tạo danh mục đầu tiên</button>
        </div>
      ) : (
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
                      <button onClick={() => openEdit(cat)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-indigo-600" title="Sửa">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteId(cat.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-600" title="Xoá">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={closeForm}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-slate-800">
                {editItem ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
              </h2>
              <button onClick={closeForm} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tên danh mục *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                  placeholder="Ví dụ: Linh kiện điện tử"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 resize-none"
                  placeholder="Mô tả ngắn về danh mục"
                />
              </div>
              {(createMutation.isError || updateMutation.isError) && (
                <p className="text-red-500 text-sm">Lỗi: {(createMutation.error || updateMutation.error)?.message}</p>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  Huỷ
                </button>
                <button type="submit" disabled={isSaving} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editItem ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Xác nhận xoá</h2>
            <p className="text-slate-500 text-sm mb-5">Bạn có chắc muốn xoá danh mục này? Thao tác không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Huỷ</button>
              <button
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Xoá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
