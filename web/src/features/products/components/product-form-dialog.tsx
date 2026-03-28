import { X, Loader2 } from 'lucide-react';
import { Product, ProductFormData } from '../types';
import { useState, useEffect } from 'react';

interface ProductFormDialogProps {
  editItem?: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => void;
  isSaving: boolean;
  error?: string | null;
  categories: { id: string; name: string }[];
}

export const ProductFormDialog = ({
  editItem,
  isOpen,
  onClose,
  onSubmit,
  isSaving,
  error,
  categories
}: ProductFormDialogProps) => {
const [formData, setFormData] = useState<ProductFormData>({ name: '', sku: '', description: '', categoryId: '' });

useEffect(() => {
if (isOpen) {
  setFormData({
    name: editItem?.name || '',
    sku: editItem?.sku || '',
    description: editItem?.description || '',
    categoryId: editItem?.categoryId || (categories.length > 0 ? categories[0].id : ''),
  });
}
}, [isOpen, editItem, categories]);

if (!isOpen) return null;

const handleSubmit = (e: React.FormEvent) => {
e.preventDefault();
onSubmit(formData);
};

return (
<div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
  <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6" onClick={e => e.stopPropagation()}>
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-lg font-semibold text-slate-800">
        {editItem ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
      </h2>
      <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
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
      {error && (
        <p className="text-red-500 text-sm">Lỗi: {error}</p>
      )}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
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
);
};
