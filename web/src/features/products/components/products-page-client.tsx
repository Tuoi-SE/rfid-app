'use client';
import { useState, useEffect } from 'react';
import { Package, Plus, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useProducts } from '../hooks/use-products';
import { useProductMutations } from '../hooks/use-product-mutations';
import { ProductsTable } from './products-table';
import { ProductFilters } from './product-filters';
import { ProductFormDialog } from './product-form-dialog';
import { DeleteProductDialog } from './delete-product-dialog';
import { Product } from '../types';
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '@/features/categories/api/get-categories';
import { Category } from '@/features/categories/types';

export function ProductsPageClient() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  const { data, isLoading, isFetching } = useProducts(buildParams());
  
  const { data: categoriesData } = useQuery({
    queryKey: ['categories-list'],
    queryFn: () => getCategories('limit=100'),
  });

  const products: Product[] = (data as any)?.data ?? data ?? [];
  const categories: Category[] = (categoriesData as any)?.data ?? categoriesData ?? [];
  const totalPages = (data as any)?.totalPages ?? 1;
  const totalItems = (data as any)?.total ?? 0;

  const { createMutation, updateMutation, deleteMutation } = useProductMutations();

  const openCreate = () => {
    setEditItem(null);
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditItem(p);
    setShowForm(true);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const formError = (createMutation.error || updateMutation.error)?.message;

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

      <ProductFilters 
        search={search} onSearchChange={setSearch} 
        categoryFilter={categoryFilter} onCategoryFilterChange={setCategoryFilter}
        categories={categories}
      />

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
          
          <ProductsTable products={products} onEdit={openEdit} onDelete={setDeleteId} />

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

      <ProductFormDialog
        editItem={editItem}
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={(formData) => {
          if (editItem) {
            updateMutation.mutate({ id: editItem.id, data: formData }, { onSuccess: () => setShowForm(false) });
          } else {
            createMutation.mutate(formData, { onSuccess: () => setShowForm(false) });
          }
        }}
        isSaving={isSaving}
        error={formError}
        categories={categories}
      />

      <DeleteProductDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
          }
        }}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
