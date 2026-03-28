import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { httpClient } from '@/lib/http/client';
import { X, Plus, Trash2, Loader2, ClipboardEdit, Search, ChevronDown } from 'lucide-react';
import { OrderItemForm, Order } from '../types';
import { updateOrder } from '../api/update-order';
import { getOrder } from '../api/get-order';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: { name: string };
}

// Custom Searchable Select (Reused logic)
const ProductSearchSelect = ({
  value,
  onChange,
  products
}: {
  value: string;
  onChange: (val: string) => void;
  products: Product[]
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedProduct = products.find(p => p.id === value);
  const filteredProducts = products.filter(p =>
    (p.name || '').toLowerCase().includes(query.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white border ${isOpen ? 'border-amber-600 ring-2 ring-amber-600/20' : 'border-slate-200'} text-slate-700 rounded-[12px] px-4 py-3 text-[14px] font-semibold cursor-pointer transition-all flex justify-between items-center`}
      >
        <span className={selectedProduct ? 'text-slate-800 line-clamp-1' : 'text-slate-400 font-normal line-clamp-1'}>
          {selectedProduct ? `[${selectedProduct.sku || 'N/A'}] ${selectedProduct.name}` : '--- Vui lòng chọn sản phẩm ---'}
        </span>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-slate-100 rounded-[16px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col">
          <div className="p-3 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Tìm tên hoặc SKU..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-[10px] text-[13px] focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-all"
              />
            </div>
          </div>
          <div className="max-h-[220px] overflow-y-auto custom-scrollbar p-1.5 flex flex-col gap-0.5">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(p => (
                <div
                  key={p.id}
                  onClick={() => {
                    onChange(p.id);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className={`px-3 py-2.5 rounded-[10px] cursor-pointer text-[13px] transition-colors ${value === p.id ? 'bg-amber-100 text-amber-700 font-bold' : 'hover:bg-slate-50 text-slate-700 font-medium'}`}
                >
                  <span className="text-slate-400 font-mono mr-2">[{p.sku || 'N/A'}]</span>
                  {p.name}
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-slate-400 text-[13px]">
                Không tìm thấy sản phẩm nào
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const EditOrderModal = ({ orderId, onClose, onSuccess }: { orderId: string, onClose: () => void, onSuccess: () => void }) => {
  const [type, setType] = useState<'INBOUND' | 'OUTBOUND'>('INBOUND');
  const [items, setItems] = useState<OrderItemForm[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch product list
  const { data: productsData } = useQuery<any>({
    queryKey: ['products', 'all'],
    queryFn: () => httpClient('/products?limit=1000'),
  });

  // Fetch current order
  const { data: orderDetails, isLoading: isOrderLoading } = useQuery<Order>({
    queryKey: ['order', orderId],
    queryFn: () => getOrder(orderId),
  });

  const rawData = productsData?.data ?? productsData;
  const products: Product[] = Array.isArray(rawData) ? rawData : Array.isArray(rawData?.items) ? rawData.items : [];

  // Initialize form with order data
  useEffect(() => {
    if (orderDetails) {
      setType(orderDetails.type);
      if (orderDetails.items && orderDetails.items.length > 0) {
        setItems(orderDetails.items.map((i: any) => ({
          productId: i.productId || i.product?.id,
          quantity: i.quantity,
        })));
      } else {
        setItems([{ productId: '', quantity: 1 }]);
      }
    }
  }, [orderDetails]);

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
      await updateOrder(orderId, { type, items });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi cập nhật phiếu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isOrderLoading) {
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
        <div className="bg-white p-6 rounded-[24px] shadow-xl flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
          <span className="font-semibold text-slate-700">Đang tải chi tiết lệnh...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 sm:p-6" onClick={onClose}>
      <div
        className="bg-white rounded-[24px] w-full max-w-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] flex flex-col max-h-[90vh] overflow-hidden border border-slate-100 transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-7 py-5 bg-gradient-to-b from-amber-50/50 to-white border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2.5 tracking-tight">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                <ClipboardEdit className="w-4 h-4" />
              </div>
              Cập Nhật Phiếu Kho
            </h2>
            <p className="text-[13px] text-slate-500 mt-1 ml-10">Mã phiếu: <span className="font-mono font-bold text-slate-700">{orderDetails?.code}</span></p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-xl text-slate-500 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-7 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="p-4 mb-6 bg-red-50 border border-red-100 rounded-[16px] text-red-600 text-[14px] font-medium flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {error}
            </div>
          )}

          <div className="space-y-8">
            {/* RADIO BUTTONS */}
            <div>
              <label className="block text-[14px] font-bold text-slate-700 mb-3 uppercase tracking-wider">Hành Động Khai Báo</label>
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex-1 cursor-pointer group">
                  <input
                    type="radio"
                    className="sr-only peer"
                    name="orderType"
                    checked={type === 'INBOUND'}
                    onChange={() => setType('INBOUND')}
                  />
                  <div className="p-5 rounded-[16px] border-2 border-slate-100 bg-white text-center peer-checked:border-[#04147B] peer-checked:bg-[#04147B]/[0.02] peer-checked:shadow-[0_0_0_4px_rgba(4,20,123,0.05)] transition-all">
                    <span className="block font-bold text-[15px] text-slate-600 group-hover:text-slate-800 peer-checked:text-[#04147B] mb-1">Nhập Kho (INBOUND)</span>
                    <span className="text-[13px] text-slate-400 peer-checked:text-[#04147B]/70">Đưa hàng hóa mới vào lưu trữ</span>
                  </div>
                </label>
                <label className="flex-1 cursor-pointer group">
                  <input
                    type="radio"
                    className="sr-only peer"
                    name="orderType"
                    checked={type === 'OUTBOUND'}
                    onChange={() => setType('OUTBOUND')}
                  />
                  <div className="p-5 rounded-[16px] border-2 border-slate-100 bg-white text-center peer-checked:border-emerald-500 peer-checked:bg-emerald-50/30 peer-checked:shadow-[0_0_0_4px_rgba(16,185,129,0.05)] transition-all">
                    <span className="block font-bold text-[15px] text-slate-600 group-hover:text-slate-800 peer-checked:text-emerald-600 mb-1">Xuất Kho (OUTBOUND)</span>
                    <span className="text-[13px] text-slate-400 peer-checked:text-emerald-600/70">Luân chuyển hàng hóa ra ngoài</span>
                  </div>
                </label>
              </div>
            </div>

            {/* REPEATER ITEM LIST */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-4">
                <label className="text-[14px] font-bold text-slate-700 uppercase tracking-wider">Danh sách Yêu Cầu</label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center gap-1.5 text-[14px] font-bold text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-4 py-2 rounded-[10px] transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Thêm dòng
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50/50 hover:bg-slate-50 p-4 rounded-[16px] border border-slate-100 transition-colors"
                  >
                    {/* Number Badge */}
                    <div className="hidden sm:flex w-8 h-8 rounded-full bg-white border border-slate-200 items-center justify-center text-[13px] font-bold text-slate-400">
                      {index + 1}
                    </div>

                    <div className="w-full sm:flex-1">
                      <ProductSearchSelect
                        value={item.productId}
                        onChange={(val) => handleItemChange(index, 'productId', val)}
                        products={products}
                      />
                    </div>

                    <div className="w-full sm:w-48 flex items-center bg-white border border-slate-200 rounded-[12px] focus-within:ring-2 focus-within:ring-amber-600/20 focus-within:border-amber-600 transition-shadow overflow-hidden">
                      <span className="pl-4 text-slate-400 text-[13px] font-bold whitespace-nowrap uppercase tracking-wide">SL:</span>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full bg-transparent text-slate-800 px-3 py-3 text-[15px] font-bold focus:outline-none text-center"
                      />
                    </div>

                    <div className="w-full sm:w-auto flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length === 1}
                        className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-[12px] disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer group"
                        title="Xóa dòng này"
                      >
                        <Trash2 className="w-5 h-5 mx-auto group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-7 py-5 bg-slate-50/80 border-t border-slate-100 flex justify-end gap-3 mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800 rounded-[12px] transition-colors font-bold text-[14px] cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-8 py-2.5 rounded-[12px] transition-all font-bold text-[14px] disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_4px_14px_0_rgba(217,119,6,0.2)] hover:shadow-[0_6px_20px_rgba(217,119,6,0.2)] hover:-translate-y-0.5 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                ĐANG LƯU...
              </>
            ) : (
              'CẬP NHẬT'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
