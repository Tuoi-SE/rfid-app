import React, { useState } from 'react';
import { X, Search, AlertCircle, PackagePlus, Box, Check } from 'lucide-react';
import { SessionData } from '../types';
import { useProducts } from '@/features/products/hooks/use-products';
import { useAssignSessionProduct } from '../hooks/use-assign-session-product';

interface AssignProductModalProps {
  session: SessionData;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AssignProductModal = ({ session, onClose, onSuccess }: AssignProductModalProps) => {
  const [search, setSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lấy danh sách sản phẩm
  const { data, isLoading } = useProducts(search ? `limit=50&search=${search}` : 'limit=50');
  const products = data?.data?.items || data || [];
  
  const { mutateAsync: assignSessionProduct } = useAssignSessionProduct();

  const handleAssign = async () => {
    if (!selectedProductId) return;
    setIsSubmitting(true);
    
    try {
      const res = await assignSessionProduct({ sessionId: session.id, productId: selectedProductId });
      alert(`Đã gán thành công ${res.data?.count || session.totalTags} thẻ vào sản phẩm!`);
      onSuccess?.();
    } catch (err: any) {
      alert(`Lỗi: ${err?.response?.data?.message || err.message || 'Không thể gán sản phẩm'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[#04147B]">
              <PackagePlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Gán Sản Phẩm Hàng Loạt</h2>
              <p className="text-sm font-medium text-slate-500 mt-0.5">
                Phiên: <span className="text-[#04147B] font-bold">{session.name}</span> • <span className="text-slate-700">{session.totalTags.toLocaleString()} thẻ</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors font-medium"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 pb-2">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm theo tên hoặc mã SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#04147B]/20 focus:border-[#04147B] transition-all text-[15px] font-medium placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto px-6 py-2 min-h-[300px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="w-8 h-8 border-3 border-slate-200 border-t-[#04147B] rounded-full animate-spin" />
              <p className="text-sm text-slate-500 font-medium">Đang tải danh sách sản phẩm...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {products.map((product: any) => (
                <button
                  key={product.id}
                  onClick={() => setSelectedProductId(product.id)}
                  className={`flex items-center p-4 rounded-xl border-2 text-left transition-all group ${
                    selectedProductId === product.id 
                      ? 'border-[#04147B] bg-indigo-50/50 shadow-[0_4px_20px_rgb(4,20,123,0.08)]' 
                      : 'border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-[10px] flex items-center justify-center shrink-0 mr-4 transition-colors ${
                    selectedProductId === product.id ? 'bg-[#04147B] text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                  }`}>
                    <Box className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-bold text-slate-900 truncate">{product.name}</h3>
                    <p className="text-[13px] font-medium text-slate-500 mt-1">
                      SKU: <span className="text-slate-700">{product.sku || 'N/A'}</span>
                      {product.category?.name && <span className="mx-1.5 text-slate-300">•</span>}
                      {product.category?.name && `Danh mục: ${product.category.name}`}
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ml-4 shrink-0 transition-all ${
                    selectedProductId === product.id ? 'border-[#04147B] bg-[#04147B] scale-110' : 'border-slate-300 group-hover:border-slate-400 group-hover:bg-slate-100'
                  }`}>
                    {selectedProductId === product.id && <Check className="w-3.5 h-3.5 text-white" strokeWidth={4} />}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4">
                <Box className="w-8 h-8" />
              </div>
              <p className="text-slate-500 font-medium text-lg tracking-tight">Không tìm thấy sản phẩm nào</p>
              <p className="text-slate-400 text-sm mt-1">Hãy thử tìm kiếm với từ khóa khác</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/80 mt-auto">
          {selectedProductId && (
            <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl border border-amber-200/60 mb-6 animate-in slide-in-from-bottom-2 duration-300">
              <div className="bg-amber-100 p-2 rounded-lg shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-sm text-amber-800 leading-relaxed font-medium pt-1">
                Toàn bộ <b className="text-amber-900">{session.totalTags.toLocaleString()} thẻ</b> quét trong phiên này sẽ được gán đè cho sản phẩm đã chọn. Các thẻ đã gán trước đó cũng sẽ bị ghi đè dữ liệu.
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition-colors"
            >
              Huỷ bỏ
            </button>
            <button
              onClick={handleAssign}
              disabled={!selectedProductId || isSubmitting}
              className="px-8 py-3 rounded-xl font-bold text-white bg-[#04147B] hover:bg-[#04147B]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#04147B]/20 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  Xác nhận Gán
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
