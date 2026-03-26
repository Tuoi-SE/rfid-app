'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Package, Plus, Pencil, Trash2, Search, X, Loader2, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  categoryId: string;
  category?: { id: string; name: string };
  _count?: { tags: number };
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
}

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: '', sku: '', description: '', categoryId: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter]);

  const buildParams = () => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', '15');
    if (search) params.set('search', search);
    if (categoryFilter) params.set('categoryId', categoryFilter);
    return params.toString();
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['products', search, categoryFilter, page],
    queryFn: () => api.getProducts(buildParams()),
    placeholderData: (previousData) => previousData, // keep old data while fetching new page
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories-list'],
    queryFn: () => api.getCategories('limit=100'),
  });

  const products: Product[] = data?.data ?? data ?? [];
  const categories: Category[] = categoriesData?.data ?? categoriesData ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.total ?? 0;

  const createMutation = useMutation({
    mutationFn: (d: any) => api.createProduct(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); closeForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: d }: any) => api.updateProduct(id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); closeForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteProduct(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); setDeleteId(null); },
  });

  const openCreate = () => {
    setEditItem(null);
    setFormData({ name: '', sku: '', description: '', categoryId: categories[0]?.id || '' });
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditItem(p);
    setFormData({ name: p.name, sku: p.sku, description: p.description || '', categoryId: p.categoryId });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-500" />
            Sản phẩm
          </h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý sản phẩm và gắn tag RFID</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Thêm sản phẩm
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all bg-white"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="pl-10 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white appearance-none min-w-[180px] text-slate-600"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading && products.length === 0 ? (
        <div className="text-center py-16 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-100">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Chưa có sản phẩm nào</p>
          <button onClick={openCreate} className="text-indigo-600 text-sm mt-2 hover:underline">Tạo sản phẩm đầu tiên</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col relative">
          {isFetching && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          )}
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
                        <button onClick={() => openEdit(p)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-indigo-600" title="Sửa">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(p.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-600" title="Xoá">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Hiển thị <span className="font-medium text-slate-700">{Math.min((page - 1) * 15 + 1, totalItems)}</span> đến{' '}
                <span className="font-medium text-slate-700">{Math.min(page * 15, totalItems)}</span> trong số{' '}
                <span className="font-medium text-slate-700">{totalItems}</span> sản phẩm
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent bg-slate-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="px-2 text-sm font-medium text-slate-600">
                  {page} / {totalPages}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent bg-slate-50 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={closeForm}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-slate-800">
                {editItem ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
              </h2>
              <button onClick={closeForm} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tên sản phẩm *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                  placeholder="Ví dụ: Raspberry Pi 5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">SKU *</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={e => setFormData({ ...formData, sku: e.target.value })}
                  required
                  disabled={!!editItem}
                  className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 font-mono ${editItem ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                  placeholder="Ví dụ: RPI-5-8GB"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Danh mục *</label>
                <select
                  value={formData.categoryId}
                  onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white"
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 resize-none"
                  placeholder="Mô tả sản phẩm"
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
            <p className="text-slate-500 text-sm mb-5">Bạn có chắc muốn xoá sản phẩm này? Tất cả tag gắn với sản phẩm sẽ bị gỡ.</p>
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
