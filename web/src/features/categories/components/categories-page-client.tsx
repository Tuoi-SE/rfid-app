'use client';
import { useState } from 'react';
import { FolderTree, Plus, Search, Loader2 } from 'lucide-react';
import { useCategories } from '../hooks/use-categories';
import { useCategoryMutations } from '../hooks/use-category-mutations';
import { CategoriesTable } from './categories-table';
import { CategoryFormDialog } from './category-form-dialog';
import { CategoryDeleteDialog } from './category-delete-dialog';
import { Category } from '../types';

export function CategoriesPageClient() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useCategories(search);
  const categories: Category[] = (data as any)?.data ?? data ?? [];

  const { createMutation, updateMutation, deleteMutation } = useCategoryMutations();

  const openCreate = () => {
    setEditItem(null);
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditItem(cat);
    setShowForm(true);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const formError = (createMutation.error || updateMutation.error)?.message;

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

      {isLoading ? (
        <div className="text-center py-16 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-100">
          <FolderTree className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Chưa có danh mục nào</p>
          <button onClick={openCreate} className="text-indigo-600 text-sm mt-2 hover:underline">Tạo danh mục đầu tiên</button>
        </div>
      ) : (
        <CategoriesTable 
          categories={categories} 
          onEdit={openEdit} 
          onDelete={setDeleteId} 
        />
      )}

      <CategoryFormDialog
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
      />

      <CategoryDeleteDialog
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
