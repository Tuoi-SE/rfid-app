'use client';

import { X, Loader2 } from 'lucide-react';
import { LocationData, LocationFormData, LocationType } from '../types';
import { useState, useEffect } from 'react';

interface LocationFormDialogProps {
  editItem?: LocationData | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LocationFormData) => void;
  isSaving: boolean;
  error?: string | null;
}

const LOCATION_TYPES: { value: LocationType; label: string }[] = [
  { value: 'WAREHOUSE', label: 'Kho Tổng (Warehouse)' },
  { value: 'WORKSHOP', label: 'Xưởng May (Workshop)' },
  { value: 'HOTEL', label: 'Khách Sạn (Hotel)' },
  { value: 'RESORT', label: 'Resort' },
  { value: 'SPA', label: 'Spa' },
  { value: 'CUSTOMER', label: 'Khách hàng (Customer)' }
];

export const LocationFormDialog = ({
  editItem,
  isOpen,
  onClose,
  onSubmit,
  isSaving,
  error
}: LocationFormDialogProps) => {
  const [formData, setFormData] = useState<LocationFormData>({ code: '', name: '', type: 'WORKSHOP', address: '' });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        code: editItem?.code || '',
        name: editItem?.name || '',
        type: editItem?.type || 'WORKSHOP',
        address: editItem?.address || '',
      });
    }
  }, [isOpen, editItem]);

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
            {editItem ? 'Chỉnh sửa cơ sở' : 'Thêm cơ sở mới'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Mã cơ sở *</label>
            <input
              type="text"
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value })}
              required
              autoFocus
              disabled={!!editItem}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 disabled:bg-slate-50 disabled:text-slate-500"
              placeholder="Vd: WH-HN-01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tên cơ sở *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              placeholder="Vd: Tổng Kho Miền Bắc"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Loại hình *</label>
            <select
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value as LocationType })}
              required
              disabled={!!editItem}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white disabled:bg-slate-50 disabled:text-slate-500"
            >
              {LOCATION_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {editItem && (
              <p className="mt-1 text-xs text-slate-500">Loại hình không thể thay đổi sau khi tạo.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Địa chỉ</label>
            <textarea
              value={formData.address || ''}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              placeholder="Số nhà, đường, quận/huyện, tỉnh/thành..."
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Huỷ
            </button>
            <button type="submit" disabled={isSaving} className="flex-1 py-2.5 bg-[#04147B] hover:bg-indigo-800 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editItem ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
