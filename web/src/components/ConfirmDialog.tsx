import { Loader2 } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDialog = ({
  isOpen,
  title,
  description,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white shadow-[0_2px_10px_-4px_rgba(220,38,38,0.5)]';
      case 'primary':
        return 'bg-[#04147B] hover:bg-[#04147B]/90 text-white shadow-[0_2px_10px_-4px_rgba(4,20,123,0.5)]';
      default:
        return 'bg-slate-800 hover:bg-slate-900 text-white shadow-sm';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-100 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-[24px] w-full max-w-[400px] shadow-2xl p-6 md:p-8 transform transition-all animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <h2 className="text-[22px] font-bold text-slate-800 mb-2.5 tracking-tight">{title}</h2>
        <p className="text-slate-500 text-[15px] mb-8 font-medium leading-relaxed">{description}</p>
        
        <div className="flex gap-3">
          <button 
            onClick={onClose} 
            disabled={isLoading}
            className="flex-1 py-3.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${getVariantStyles()}`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
