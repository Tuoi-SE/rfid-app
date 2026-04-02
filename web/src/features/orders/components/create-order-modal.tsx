import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { httpClient } from '@/lib/http/client';
import { X, Plus, Trash2, Loader2, ClipboardList, Search, ChevronDown } from 'lucide-react';
import { OrderItemForm } from '../types';
import { createOrder } from '../api/create-order';
import { useAuth } from '@/providers/AuthProvider';
import { hasAdminAccess } from '@/utils/role-helpers';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: { name: string };
}

interface LocationOption {
  id: string;
  code: string;
  name: string;
  type:
  | 'ADMIN'
  | 'WORKSHOP'
  | 'WORKSHOP_WAREHOUSE'
  | 'WAREHOUSE'
  | 'HOTEL'
  | 'RESORT'
  | 'SPA'
  | 'CUSTOMER';
  children?: Array<{
    id: string;
    code: string;
    name: string;
    type:
    | 'ADMIN'
    | 'WORKSHOP'
    | 'WORKSHOP_WAREHOUSE'
    | 'WAREHOUSE'
    | 'HOTEL'
    | 'RESORT'
    | 'SPA'
    | 'CUSTOMER';
  }>;
}

type OutboundDestinationKind = 'WAREHOUSE' | 'WORKSHOP' | 'CUSTOMER';

// Custom Searchable Select Component
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
        className={`w-full bg-white border ${isOpen ? 'border-[#04147B] ring-2 ring-[#04147B]/20' : 'border-slate-200'} text-slate-700 rounded-[12px] px-4 py-3 text-[14px] font-semibold cursor-pointer transition-all flex justify-between items-center`}
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
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-[10px] text-[13px] focus:outline-none focus:border-[#04147B] focus:ring-1 focus:ring-[#04147B] transition-all"
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
                  className={`px-3 py-2.5 rounded-[10px] cursor-pointer text-[13px] transition-colors ${value === p.id ? 'bg-[#04147B]/10 text-[#04147B] font-bold' : 'hover:bg-slate-50 text-slate-700 font-medium'}`}
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

export const CreateOrderModal = ({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) => {
  const { user } = useAuth();
  const [type, setType] = useState<'INBOUND' | 'OUTBOUND'>('INBOUND');
  const [inboundLocationId, setInboundLocationId] = useState('');
  const [outboundDestinationKind, setOutboundDestinationKind] = useState<OutboundDestinationKind>('WAREHOUSE');
  const [outboundLocationId, setOutboundLocationId] = useState('');
  const [items, setItems] = useState<OrderItemForm[]>([{ productId: '', quantity: 1 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { data: productsData } = useQuery<any>({
    queryKey: ['products', 'all'],
    queryFn: () => httpClient('/products?limit=1000'),
  });

  const { data: locationsData } = useQuery<any>({
    queryKey: ['locations', 'order-destinations'],
    queryFn: () => httpClient('/locations?limit=1000'),
  });

  const rawData = productsData?.data ?? productsData;
  const products: Product[] = Array.isArray(rawData) ? rawData : Array.isArray(rawData?.items) ? rawData.items : [];
  const rawLocations = locationsData?.data ?? locationsData;
  const locations: LocationOption[] = Array.isArray(rawLocations)
    ? rawLocations
    : Array.isArray(rawLocations?.items)
      ? rawLocations.items
      : [];

  const ownInboundLocation = useMemo(
    () =>
      locations.find(
        (location) => !!user?.locationId && location.id === user.locationId,
      ),
    [locations, user?.locationId],
  );

  const inboundLocations = useMemo(() => {
    const inboundAllowedTypes = new Set(['WORKSHOP', 'WORKSHOP_WAREHOUSE', 'WAREHOUSE']);
    const byId = new Map<string, LocationOption>();

    const addLocation = (location?: Pick<LocationOption, 'id' | 'code' | 'name' | 'type'>) => {
      if (!location || !inboundAllowedTypes.has(location.type)) return;
      byId.set(location.id, { ...location });
    };

    // Luôn ưu tiên Kho hiện tại của user (Manager/Staff)
    addLocation(ownInboundLocation);
    ownInboundLocation?.children?.forEach((child) => addLocation(child));

    // CHỈ CÓ ADMIN mới được quyền thấy toàn bộ mọi Kho tổng để nhập hàng trực tiếp
    if (hasAdminAccess(user?.role)) {
      locations
        .filter((location) => location.type === 'WAREHOUSE')
        .forEach((location) => addLocation(location));
    }

    // Nếu không thuộc quyền quản lý kho cụ thể (vd: Admin chưa gán kho), lấy danh sách tất cả kho được phép
    if (byId.size === 0) {
      locations
        .filter((location) => inboundAllowedTypes.has(location.type))
        .forEach((location) => addLocation(location));
    }

    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [locations, ownInboundLocation, user?.role]);

  const outboundLocations = useMemo(() => {
    const workshopOwnerId = user?.locationId;
    return locations
      .filter((location) => {
        if (outboundDestinationKind === 'WAREHOUSE') {
          return location.type === 'WAREHOUSE';
        }
        if (outboundDestinationKind === 'WORKSHOP') {
          return (
            location.type === 'WORKSHOP' &&
            (!workshopOwnerId || location.id !== workshopOwnerId)
          );
        }
        return (
          location.type === 'HOTEL' ||
          location.type === 'RESORT' ||
          location.type === 'SPA' ||
          location.type === 'CUSTOMER'
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [locations, outboundDestinationKind, user?.locationId]);

  useEffect(() => {
    if (type !== 'INBOUND') return;
    if (!inboundLocations.some((location) => location.id === inboundLocationId)) {
      const preferredOwnLocationId = ownInboundLocation?.id;
      const fallbackLocationId =
        (preferredOwnLocationId &&
          inboundLocations.some((location) => location.id === preferredOwnLocationId)
          ? preferredOwnLocationId
          : inboundLocations[0]?.id) || '';
      setInboundLocationId(fallbackLocationId);
    }
  }, [type, inboundLocations, inboundLocationId, ownInboundLocation?.id]);

  useEffect(() => {
    if (type !== 'OUTBOUND') return;
    if (!outboundLocations.some((location) => location.id === outboundLocationId)) {
      setOutboundLocationId('');
    }
  }, [type, outboundLocationId, outboundLocations]);

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

    if (type === 'INBOUND' && !inboundLocationId) {
      setError('Vui lòng chọn nơi nhập kho cho phiếu nhập kho.');
      return;
    }

    if (type === 'OUTBOUND' && !outboundLocationId) {
      setError('Vui lòng chọn nơi xuất đến cho phiếu xuất kho.');
      return;
    }

    try {
      setIsSubmitting(true);
      await createOrder({
        type,
        items,
        ...(type === 'INBOUND' ? { locationId: inboundLocationId } : {}),
        ...(type === 'OUTBOUND' ? { locationId: outboundLocationId } : {}),
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tạo phiếu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 sm:p-6" onClick={onClose}>
      <div
        className="bg-white rounded-[24px] w-full max-w-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] flex flex-col max-h-[90vh] overflow-hidden border border-slate-100 transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-7 py-5 bg-gradient-to-b from-slate-50/80 to-white border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2.5 tracking-tight">
              <div className="w-8 h-8 rounded-xl bg-[#04147B]/10 flex items-center justify-center text-[#04147B]">
                <ClipboardList className="w-4 h-4" />
              </div>
              Tạo Phiếu Nhập/Xuất Mới
            </h2>
            <p className="text-[13px] text-slate-500 mt-1 ml-10">Tạo lệnh thao tác kho để quét RFID thực tế trên Mobile App</p>
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
                    <span className="text-[13px] text-slate-400 peer-checked:text-[#04147B]/70">Đưa hàng hóa mới vào lưu trữ hệ thống</span>
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
                    <span className="text-[13px] text-slate-400 peer-checked:text-emerald-600/70">Bán hoặc luân chuyển hàng hóa ra ngoài</span>
                  </div>
                </label>
              </div>
            </div>

            {type === 'INBOUND' && (
              <div className="bg-[#04147B]/[0.03] border border-[#04147B]/10 rounded-[16px] p-5 space-y-4">
                <div>
                  <label className="block text-[14px] font-bold text-[#04147B] mb-3 uppercase tracking-wider">
                    Nơi Nhập Kho
                  </label>
                  <p className="text-[13px] text-slate-600 font-medium">
                    Manager nhập vào kho xưởng của mình.
                  </p>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
                    Chọn kho nhập
                  </label>
                  <select
                    value={inboundLocationId}
                    onChange={(e) => setInboundLocationId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-[12px] px-4 py-3 text-[14px] font-semibold text-slate-700 focus:outline-none focus:border-[#04147B] focus:ring-2 focus:ring-[#04147B]/20 transition-all"
                  >
                    <option value="">--- Chọn kho nhập ---</option>
                    {inboundLocations.map((location) => (
                      <option key={location.id} value={location.id}>
                        [{location.code}] {location.name}
                      </option>
                    ))}
                  </select>
                  {inboundLocations.length === 0 && (
                    <p className="mt-2 text-[12px] text-slate-500">
                      Không có địa điểm phù hợp cho nhóm nhập kho này.
                    </p>
                  )}
                </div>
              </div>
            )}

            {type === 'OUTBOUND' && (
              <div className="bg-emerald-50/40 border border-emerald-100 rounded-[16px] p-5 space-y-4">
                <div>
                  <label className="block text-[14px] font-bold text-emerald-700 mb-3 uppercase tracking-wider">
                    Nơi Xuất Đến
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setOutboundDestinationKind('WAREHOUSE')}
                      className={`px-4 py-3 rounded-[12px] border text-[13px] font-bold transition-colors ${outboundDestinationKind === 'WAREHOUSE'
                        ? 'border-emerald-500 bg-emerald-100 text-emerald-700'
                        : 'border-emerald-200 bg-white text-slate-600 hover:bg-emerald-50'
                        }`}
                    >
                      Kho tổng
                    </button>
                    <button
                      type="button"
                      onClick={() => setOutboundDestinationKind('WORKSHOP')}
                      className={`px-4 py-3 rounded-[12px] border text-[13px] font-bold transition-colors ${outboundDestinationKind === 'WORKSHOP'
                        ? 'border-emerald-500 bg-emerald-100 text-emerald-700'
                        : 'border-emerald-200 bg-white text-slate-600 hover:bg-emerald-50'
                        }`}
                    >
                      Kho xưởng khác
                    </button>
                    <button
                      type="button"
                      onClick={() => setOutboundDestinationKind('CUSTOMER')}
                      className={`px-4 py-3 rounded-[12px] border text-[13px] font-bold transition-colors ${outboundDestinationKind === 'CUSTOMER'
                        ? 'border-emerald-500 bg-emerald-100 text-emerald-700'
                        : 'border-emerald-200 bg-white text-slate-600 hover:bg-emerald-50'
                        }`}
                    >
                      Khách hàng
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
                    Chọn địa điểm cụ thể
                  </label>
                  <select
                    value={outboundLocationId}
                    onChange={(e) => setOutboundLocationId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-[12px] px-4 py-3 text-[14px] font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  >
                    <option value="">--- Chọn địa điểm đích ---</option>
                    {outboundLocations.map((location) => (
                      <option key={location.id} value={location.id}>
                        [{location.code}] {location.name}
                      </option>
                    ))}
                  </select>
                  {outboundLocations.length === 0 && (
                    <p className="mt-2 text-[12px] text-slate-500">
                      Không có địa điểm phù hợp cho nhóm đích này.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* REPEATER ITEM LIST */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-4">
                <label className="text-[14px] font-bold text-slate-700 uppercase tracking-wider">Danh sách Yêu Cầu</label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center gap-1.5 text-[14px] font-bold text-[#04147B] hover:text-[#030e57] hover:bg-[#04147B]/5 px-4 py-2 rounded-[10px] transition-colors cursor-pointer"
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

                    <div className="w-full sm:w-48 flex items-center bg-white border border-slate-200 rounded-[12px] focus-within:ring-2 focus-within:ring-[#04147B]/20 focus-within:border-[#04147B] transition-shadow overflow-hidden">
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
            className="flex items-center gap-2 bg-[#04147B] hover:bg-[#030e57] text-white px-8 py-2.5 rounded-[12px] transition-all font-bold text-[14px] disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_4px_14px_0_rgba(4,20,123,0.39)] hover:shadow-[0_6px_20px_rgba(4,20,123,0.23)] hover:-translate-y-0.5 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                ĐANG TẠO...
              </>
            ) : (
              'LƯU PHIẾU'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
