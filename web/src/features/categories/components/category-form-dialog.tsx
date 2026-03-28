import { X, Loader2, Shapes, AlertCircle } from 'lucide-react';
import { Category, CategoryFormData } from '../types';
import { useState, useEffect } from 'react';

interface CategoryFormDialogProps {
  editItem?: Category | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormData) => void;
  isSaving: boolean;
  error?: string | null;
}

export const CategoryFormDialog = ({
  editItem,
  isOpen,
  onClose,
  onSubmit,
  isSaving,
  error
}: CategoryFormDialogProps) => {
  const [formData, setFormData] = useState<CategoryFormData>({ name: '', description: '' });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: editItem?.name || '',
        description: editItem?.description || '',
      });
    }
  }, [isOpen, editItem]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isEdit = !!editItem;

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-100 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[24px] w-full max-w-[460px] shadow-2xl transform transition-all animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with brand accent */}
        <div className="relative bg-linear-to-br from-[#04147B] to-[#1a3a9e] px-8 pt-8 pb-10">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4 text-white/80" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mb-5">
            <Shapes className="w-6 h-6 text-white stroke-[1.5]" />
          </div>
          <h2 className="text-[22px] font-bold text-white tracking-tight leading-tight">
            {isEdit ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
          </h2>
          <p className="text-white/60 text-sm font-medium mt-1.5">
            {isEdit
              ? 'Cập nhật thông tin cho danh mục sản phẩm'
              : 'Tạo danh mục để phân loại và quản lý sản phẩm'}
          </p>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="px-8 pb-8 -mt-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-5">
            {/* Name field */}
            <div>
              <label className="block text-[11px] font-black text-slate-500 tracking-widest uppercase mb-2">
                Tên danh mục <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
                autoFocus
                className="w-full px-4 py-3 bg-[#F4F7FB] border border-slate-200/80 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#04147B]/20 focus:border-[#04147B]/40 focus:bg-white transition-all"
                placeholder="Ví dụ: Linh kiện điện tử"
              />
            </div>

            {/* Description field */}
            <div>
              <label className="block text-[11px] font-black text-slate-500 tracking-widest uppercase mb-2">
                Mô tả
              </label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-[#F4F7FB] border border-slate-200/80 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#04147B]/20 focus:border-[#04147B]/40 focus:bg-white transition-all resize-none"
                placeholder="Mô tả ngắn về danh mục này..."
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2.5 mt-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 py-3.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors disabled:opacity-50"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3.5 bg-[#04147B] hover:bg-[#04147B]/90 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_2px_10px_-4px_rgba(4,20,123,0.5)]"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? 'Cập nhật' : 'Tạo danh mục'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
