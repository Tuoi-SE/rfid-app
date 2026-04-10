import { X, Loader2 } from 'lucide-react';
import { User, UserFormData } from '../types';
import { useState, useEffect } from 'react';
import { useLocations } from '@/features/locations/hooks/use-locations';

interface UserFormDialogProps {
  editItem?: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => void;
  isSaving: boolean;
  error?: string | null;
}

export const UserFormDialog = ({
  editItem,
  isOpen,
  onClose,
  onSubmit,
  isSaving,
  error
}: UserFormDialogProps) => {
const { data: locationsData } = useLocations();
const responseData = (locationsData as Record<string, unknown>)?.data ?? locationsData;
const locations: any[] = Array.isArray(responseData) ? responseData : ((responseData as Record<string, unknown>)?.items as any[] || []);

const [formData, setFormData] = useState<UserFormData>({ username: '', email: '', password: '', role: 'STAFF', locationId: '' });

useEffect(() => {
if (isOpen) {
  setFormData({
    username: editItem?.username || '',
    email: editItem?.email || '',
    password: '',
    role: editItem?.role || 'STAFF',
    locationId: editItem?.locationId || '',
  });
}
}, [isOpen, editItem]);

if (!isOpen) return null;

const handleSubmit = (e: React.FormEvent) => {
e.preventDefault();
const payload = { ...formData };
if (!payload.password) {
  delete payload.password;
}
if (payload.role === 'ADMIN' || payload.role === 'SUPER_ADMIN') {
  payload.locationId = null;
}
onSubmit(payload);
};

return (
<div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
  <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6" onClick={e => e.stopPropagation()}>
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-lg font-semibold text-slate-800">
        {editItem ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}
      </h2>
      <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
    </div>
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Tên đăng nhập *</label>
        <input
          type="text"
          value={formData.username}
          onChange={e => setFormData({ ...formData, username: e.target.value })}
          required
          autoFocus
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
        <input
          type="email"
          value={formData.email}
          onChange={e => setFormData({ ...formData, email: e.target.value })}
          required
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
        />
      </div>
      {editItem && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu mới (Bỏ trống nếu không đổi)</label>
          <input
            type="password"
            value={formData.password || ''}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
          />
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Vai trò *</label>
        <select
          value={formData.role}
          onChange={e => setFormData({ ...formData, role: e.target.value })}
          required
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white"
        >
          <option value="STAFF">Nhân viên (STAFF)</option>
          <option value="WAREHOUSE_MANAGER">Quản lý Kho (MANAGER)</option>
          <option value="ADMIN">Quản trị (ADMIN)</option>
          <option value="SUPER_ADMIN">Quản trị cấp cao (SUPER ADMIN)</option>
        </select>
      </div>
      
      {formData.role !== 'ADMIN' && formData.role !== 'SUPER_ADMIN' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Trực thuộc (Kho/Xưởng) *</label>
          <select
            value={formData.locationId || ''}
            onChange={e => setFormData({ ...formData, locationId: e.target.value })}
            required
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white"
          >
            <option value="" disabled>-- Chọn nơi làm việc --</option>
            {locations.map((loc: any) => (
              <option key={loc.id} value={loc.id}>
                {loc.code} - {loc.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {error && (
        <p className="text-red-500 text-sm">Lỗi: {error}</p>
      )}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          Huỷ
        </button>
        <button type="submit" disabled={isSaving} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          {editItem ? 'Cập nhật' : 'Tạo mới'}
        </button>
      </div>
    </form>
  </div>
</div>
);
};
