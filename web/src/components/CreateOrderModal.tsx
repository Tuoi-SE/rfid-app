import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { X, Plus, Trash2, Loader2, ClipboardList } from 'lucide-react';

interface OrderItemForm {
  productId: string;
  quantity: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  category: { name: string };
}

export default function CreateOrderModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [type, setType] = useState<'INBOUND' | 'OUTBOUND'>('INBOUND');
  const [items, setItems] = useState<OrderItemForm[]>([{ productId: '', quantity: 1 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { data: productsData } = useQuery<{ data: Product[] }>({
    queryKey: ['products', 'all'],
    queryFn: () => api.getProducts('limit=1000'),
  });

  const products = productsData?.data || [];

  const handleAddItem = () => {
    setItems([...items, { productId: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleItemChange = (index: number, field: keyof OrderItemForm, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (items.some(item => !item.productId || item.quantity < 1)) {
      setError('Vui lòng chọn sản phẩm và nhập số lượng lớn hơn 0 cho tất cả các dòng.');
      return;
    }

    const productIds = items.map(i => i.productId);
    if (new Set(productIds).size !== productIds.length) {
      setError('Sản phẩm bị trùng lặp trong danh sách.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.createOrder({ type, items });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tạo phiếu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-indigo-600" />
            Tạo Phiếu Nhập/Xuất Mới
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="p-4 mb-6 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">Loại Phiếu Kho</label>
              <div className="flex gap-4">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    className="sr-only peer"
                    name="orderType"
                    checked={type === 'INBOUND'}
                    onChange={() => setType('INBOUND')}
                  />
                  <div className="p-4 rounded-xl border-2 border-slate-100 bg-white text-center peer-checked:border-indigo-600 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 font-semibold text-slate-600 transition-all">
                    Nhập Kho (INBOUND)
                  </div>
                </label>
                <label className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    className="sr-only peer"
                    name="orderType"
                    checked={type === 'OUTBOUND'}
                    onChange={() => setType('OUTBOUND')}
                  />
                  <div className="p-4 rounded-xl border-2 border-slate-100 bg-white text-center peer-checked:border-pink-600 peer-checked:bg-pink-50 peer-checked:text-pink-700 font-semibold text-slate-600 transition-all">
                    Xuất Kho (OUTBOUND)
                  </div>
                </label>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <label className="text-sm font-bold text-slate-700">Danh sách Sản phẩm yêu cầu</label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" /> Thêm dòng
                </button>
              </div>
              
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="w-full sm:flex-1">
                      <select
                        value={item.productId}
                        onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                      >
                        <option value="" className="text-slate-400">--- Vui lòng chọn sản phẩm ---</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="w-full sm:w-40 flex items-center gap-2">
                      <span className="text-slate-500 text-sm font-medium whitespace-nowrap">Số lượng:</span>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-center"
                      />
                    </div>

                    <div className="w-full sm:w-auto flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length === 1}
                        className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors shadow-sm sm:shadow-none border border-slate-200 sm:border-transparent"
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 mt-auto rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors font-medium text-sm shadow-sm"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-xl transition-colors font-medium text-sm disabled:opacity-70 shadow-sm"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? 'Đang tạo...' : 'Lưu Phiếu'}
          </button>
        </div>
      </div>
    </div>
  );
}
