import { useState } from 'react';
import { useTagMutations } from '../hooks/use-tag-mutations';
import { useProducts } from '@/features/products/hooks/use-products';
import { X, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface BulkEditProps {
  selectedEpcs: string[];
  onClose: () => void;
}

export function BulkEditModal({ selectedEpcs, onClose }: BulkEditProps) {
  const queryClient = useQueryClient();
  const [location, setLocation] = useState('');
  const [search, setSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [isPending, setIsPending] = useState(false);
  
  const { data: productsData, isLoading: isLoadingProducts } = useProducts(`limit=20${search ? `&search=${search}` : ''}`);
  const products = (productsData as any)?.data || productsData || [];

  const { assignMutation, updateMutation } = useTagMutations();

  const handleBulkUpdate = async () => {
    setIsPending(true);
    try {
      if (selectedProductId) {
        await assignMutation.mutateAsync({ productId: selectedProductId, tagIds: selectedEpcs });
      }
      if (location.trim()) {
        await Promise.all(
          selectedEpcs.map(epc => updateMutation.mutateAsync({ epc, data: { location: location.trim() } }))
        );
      }
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      onClose();
    } catch (error) {
       console.error(error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Gán hàng loạt ({selectedEpcs.length} thẻ)</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded bg-slate-50"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-500 mb-2">Chỉ các trường có dữ liệu mới được cập nhật. Bỏ trống nếu muốn giữ nguyên.</p>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Gán Sản phẩm (tìm kiếm)</label>
            <div className="relative border border-slate-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 bg-white">
              <input 
                value={search} onChange={e => setSearch(e.target.value)} 
                placeholder="Gõ tên sản phẩm hoặc SKU..."
                className="w-full px-3 py-2 outline-none text-sm rounded-t-lg border-b border-slate-100 block" 
              />
              <div className="max-h-36 overflow-y-auto w-full rounded-b-lg">
                {isLoadingProducts ? (
                  <div className="p-3 text-center text-slate-400"><Loader2 className="w-4 h-4 animate-spin mx-auto" /></div>
                ) : products.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-500 bg-slate-50">Không tìm thấy sản phẩm</div>
                ) : (
                  products.map((p: any) => (
                    <label key={p.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 text-sm">
                      <input 
                        type="radio" name="bulk_product_select" 
                        value={p.id} checked={selectedProductId === p.id} 
                        onChange={() => setSelectedProductId(p.id)} 
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <div className="font-medium text-slate-800">{p.name}</div>
                        <div className="text-xs text-slate-500">SKU: {p.sku} | {p.category?.name || '-'}</div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Vị trí lưu kho mới</label>
            <input 
              value={location} onChange={e => setLocation(e.target.value)} 
              placeholder="Ví dụ: Kệ A1"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" 
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors">Hủy bõ</button>
          <button 
            onClick={handleBulkUpdate}
            disabled={isPending || (!selectedProductId && !location)}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Cập nhật {selectedEpcs.length} thẻ
          </button>
        </div>
      </div>
    </div>
  );
}
