import React, { useState, useEffect } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import { httpClient } from '@/lib/http/client';
import { TransferData } from '../types';

interface EditTransferModalProps {
  transfer: TransferData;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditTransferModal = ({ transfer, onClose, onSuccess }: EditTransferModalProps) => {
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [destinationId, setDestinationId] = useState<string>(transfer.destinationId || '');

  useEffect(() => {
    let mounted = true;
    httpClient('/locations?limit=100').then((res) => {
      if (mounted) {
        const payload = res?.data || res;
        const locs = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
        setLocations(locs);
        setIsLoading(false);
      }
    }).catch((err) => {
      console.error(err);
      if (mounted) setIsLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationId) return alert('Vui lòng chọn nơi nhận mới!');
    if (destinationId === transfer.sourceId) return alert('Nơi xuất và nơi nhận không được trùng nhau!');

    setIsSubmitting(true);
    try {
      await httpClient(`/transfers/${transfer.id}/destination`, {
        method: 'POST',
        body: JSON.stringify({ destinationId })
      });
      alert(`Đã cập nhật nơi nhận thành công!`);
      onSuccess();
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Restrict destination options based on original route type
  const validLocationTypes = (() => {
    switch (transfer.type) {
      case 'ADMIN_TO_WORKSHOP': return ['WORKSHOP'];
      case 'WORKSHOP_TO_WAREHOUSE': return ['WAREHOUSE'];
      case 'WAREHOUSE_TO_CUSTOMER': return ['HOTEL', 'RESORT', 'SPA', 'CUSTOMER'];
      default: return [];
    }
  })();

  const validLocations = locations.filter(loc => validLocationTypes.includes(loc.type));

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 animate-in fade-in duration-200" onClick={onClose}>
      <form
        className="bg-white rounded-[24px] w-full max-w-[500px] shadow-2xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Đổi xưởng nhận hàng</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Mã lệnh: {transfer.code}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-[#04147B]" />
              <div className="mt-3 text-sm font-medium text-slate-500">Đang tải danh sách địa điểm...</div>
            </div>
          ) : (
            <>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Nơi đi (Không đổi)</p>
                <p className="text-sm font-bold text-slate-700">{transfer.source?.name}</p>
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold text-indigo-400 tracking-widest uppercase">Nơi Đến Mới</label>
                <select
                  className="w-full px-4 py-3 bg-indigo-50/30 border border-slate-200 rounded-xl text-sm font-bold text-[#04147B] outline-none focus:border-[#04147B] focus:ring-1 focus:ring-[#04147B] transition-all"
                  value={destinationId}
                  onChange={(e) => setDestinationId(e.target.value)}
                  required
                >
                  <option value="" disabled>-- Chọn xưởng nhận mới --</option>
                  {validLocations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.type})</option>
                  ))}
                </select>
                {validLocations.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">Không có địa điểm nào phù hợp với tuyến đường này.</p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-white hover:text-slate-800 transition-colors disabled:opacity-50"
          >
            Hủy
          </button>

          <button
            type="submit"
            disabled={isSubmitting || isLoading || destinationId === transfer.destinationId}
            className="flex-1 py-3 bg-[#04147B] hover:bg-[#04147B]/90 text-white shadow-[0_2px_10px_-4px_rgba(4,20,123,0.5)] rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu Thay Đổi
          </button>
        </div>
      </form>
    </div>
  );
};
