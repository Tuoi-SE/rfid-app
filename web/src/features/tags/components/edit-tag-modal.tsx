import { useState } from 'react';
import { useTagMutations } from '../hooks/use-tag-mutations';
import { useProducts } from '@/features/products/hooks/use-products';
import { useLocations } from '@/features/locations/hooks/use-locations';
import { X, Loader2 } from 'lucide-react';

interface EditTagProps {
  epc: string;
  initialName: string;
  initialCategory: string;
  initialLocation: string;
  initialLocationId: string;
  initialStatus: string;
  onClose: () => void;
}

const TAG_STATUSES = [
  { value: 'UNASSIGNED', label: 'Chưa gán (UNASSIGNED)' },
  { value: 'IN_WORKSHOP', label: 'Trong xưởng (IN_WORKSHOP)' },
  { value: 'IN_WAREHOUSE', label: 'Trong kho (IN_WAREHOUSE)' },
  { value: 'IN_TRANSIT', label: 'Đang vận chuyển (IN_TRANSIT)' },
  { value: 'COMPLETED', label: 'Đã xuất/Bán (COMPLETED)' },
  { value: 'MISSING', label: 'Mất tích (MISSING)' },
];

export const EditTagModal = ({ epc, initialName, initialCategory, initialLocation, initialLocationId, initialStatus, onClose }: EditTagProps) => {
  const [location, setLocation] = useState(initialLocation || '');
  const [locationId, setLocationId] = useState(initialLocationId || '');
  const [status, setStatus] = useState(initialStatus || 'UNASSIGNED');
  
  const [search, setSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  const { data: productsData, isLoading: isLoadingProducts } = useProducts(`limit=20${search ? `&search=${search}` : ''}`);
  const rawData = (productsData as any)?.data ?? productsData;
  const products = Array.isArray(rawData) ? rawData : Array.isArray(rawData?.items) ? rawData.items : [];

  const { data: locationsData, isLoading: isLoadingLocations } = useLocations();
  const rawLocations = (locationsData as any)?.data ?? locationsData;
  const sysLocations = Array.isArray(rawLocations) ? rawLocations : Array.isArray(rawLocations?.items) ? rawLocations.items : [];

  const { updateMutation } = useTagMutations();

  const handleUpdate = () => {
    updateMutation.mutate(
      { 
        epc, 
        data: { 
          productId: selectedProductId || undefined, 
          location: location.trim() || undefined,
          locationId: locationId || undefined,
          status: status !== initialStatus ? (status as any) : undefined
        } 
      },
      { onSuccess: onClose }
    );
  };

  const hasChanges = selectedProductId || location !== initialLocation || locationId !== initialLocationId || status !== initialStatus;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-800">Cập nhật Thẻ RFID</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded bg-slate-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mã thẻ (EPC)</label>
            <input
              value={epc}
              disabled
              className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg outline-none text-sm uppercase font-mono text-slate-500 cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái gốc</label>
               <div className="px-3 py-2 h-[38px] flex items-center bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 font-medium">
                 {TAG_STATUSES.find(s => s.value === initialStatus)?.label || initialStatus}
               </div>
            </div>
            <div>
               <label className="block text-sm font-medium text-indigo-700 mb-1">Cập nhật Trạng thái</label>
               <select
                 value={status}
                 onChange={e => setStatus(e.target.value)}
                 className="w-full px-3 py-2 h-[38px] border border-indigo-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium bg-indigo-50/50"
               >
                 {TAG_STATUSES.map(s => (
                   <option key={s.value} value={s.value}>{s.label}</option>
                 ))}
               </select>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="block text-sm font-medium text-slate-700 mb-1">Đang gán Sản phẩm (Cũ)</label>
            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 mb-3">
              {initialName ? `${initialName} - ${initialCategory}` : 'Chưa gán'}
            </div>

            <label className="block text-sm font-medium text-slate-700 mb-1">Tìm Sản phẩm để Gán mới</label>
            <div className="relative border border-slate-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 bg-white">
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Khởi tạo hoặc gõ tên SP mới..."
                className="w-full px-3 py-2 outline-none text-sm rounded-t-lg border-b border-slate-100 block bg-slate-50/50"
              />
              <div className="max-h-32 overflow-y-auto w-full rounded-b-lg">
                {isLoadingProducts ? (
                  <div className="p-3 text-center text-slate-400"><Loader2 className="w-4 h-4 animate-spin mx-auto" /></div>
                ) : products.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-500 bg-slate-50">Không tìm thấy sản phẩm</div>
                ) : (
                  products.map((p: any) => (
                    <label key={p.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 text-sm">
                      <input
                        type="radio" name="product_select"
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

          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-3">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vị trí Điểm (Location)</label>
                <select
                  value={locationId}
                  onChange={e => setLocationId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                >
                  <option value="">Không xác định</option>
                  {!isLoadingLocations && sysLocations.map((loc: any) => (
                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.type})</option>
                  ))}
                </select>
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú Vị trí</label>
                <input
                  value={location} onChange={e => setLocation(e.target.value)}
                  placeholder="Kệ A1..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                />
             </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors">Hủy bỏ</button>
          <button
            onClick={handleUpdate}
            disabled={updateMutation.isPending || !hasChanges}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/80 rounded-lg disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
};
