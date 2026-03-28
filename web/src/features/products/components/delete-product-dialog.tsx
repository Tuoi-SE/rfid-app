import { Loader2 } from 'lucide-react';

interface DeleteProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export const DeleteProductDialog = ({ isOpen, onClose, onConfirm, isDeleting }: DeleteProductDialogProps) => {
if (!isOpen) return null;

return (
<div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
  <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6" onClick={e => e.stopPropagation()}>
    <h2 className="text-lg font-semibold text-slate-800 mb-2">Xác nhận xoá</h2>
    <p className="text-slate-500 text-sm mb-5">Bạn có chắc muốn xoá sản phẩm này? Tất cả tag gắn với sản phẩm sẽ bị gỡ.</p>
    <div className="flex gap-3">
      <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Huỷ</button>
      <button
        onClick={onConfirm}
        disabled={isDeleting}
        className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
        Xoá
      </button>
    </div>
  </div>
</div>
);
};
