import React, { useState, useEffect } from 'react';
import { X, Loader2, ArrowRight } from 'lucide-react';
import { httpClient } from '@/lib/http/client';
import { TransferType } from '../types';

interface CreateTransferModalProps {
  session: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateTransferModal = ({ session, onClose, onSuccess }: CreateTransferModalProps) => {
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [sourceId, setSourceId] = useState<string>('');
  const [destinationId, setDestinationId] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    httpClient('/locations?limit=100').then((res) => {
      if (mounted) {
        // Handle ResponseInterceptor wrapping and Pagination formatting
        const payload = res?.data || res;
        const locs = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
        setLocations(locs);

        // Auto-select Admin if available
        const adminLoc = locs.find((l: any) => l.type === 'ADMIN');
        if (adminLoc) setSourceId(adminLoc.id);

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
    if (!sourceId || !destinationId) return alert('Vui lòng chọn đầy đủ nơi xuất và nơi nhận!');
    if (sourceId === destinationId) return alert('Nơi xuất và nơi nhận không được trùng nhau!');

    const sourceLocation = locations.find(l => l.id === sourceId);
    const destLocation = locations.find(l => l.id === destinationId);

    // Determine type
    let type: TransferType = 'ADMIN_TO_WORKSHOP';
    if (sourceLocation?.type === 'ADMIN' && destLocation?.type === 'WORKSHOP') {
      type = 'ADMIN_TO_WORKSHOP';
    } else if (sourceLocation?.type === 'WORKSHOP' && destLocation?.type === 'WAREHOUSE') {
      type = 'WORKSHOP_TO_WAREHOUSE';
    } else if (sourceLocation?.type === 'WAREHOUSE' && ['HOTEL', 'SPA', 'RESORT'].includes(destLocation?.type)) {
      type = 'WAREHOUSE_TO_CUSTOMER';
    } else {
      return alert(`Luồng luân chuyển không hợp lệ theo quy chế hệ thống. Không hỗ trợ luồng: ${sourceLocation?.type} -> ${destLocation?.type}`);
    }

    setIsSubmitting(true);
    try {
      // 1. Fetch tags from session
      const sessRes = await httpClient(`/sessions/${session.id}`);
      const tagIds = sessRes?.data?.scans?.map((s: any) => s.tag.id) || [];

      if (tagIds.length === 0) {
        throw new Error('Phiên quét này không có thẻ RFID nào.');
      }

      // 2. Post transfer
      await httpClient('/transfers', {
        method: 'POST',
        body: JSON.stringify({
          type,
          sourceId,
          destinationId,
          tagIds
        })
      });

      alert(`Khởi tạo Luân Chuyển thành công cho ${tagIds.length} Tags!`);
      onSuccess();
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 animate-in fade-in duration-200" onClick={onClose}>
      <form
        className="bg-white rounded-[24px] w-full max-w-[500px] shadow-2xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Tạo Điều Chuyển</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Phân bổ {session.totalTags} Tags từ phiên "{session.name}"
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
              {/* Source List */}
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-slate-400 tracking-widest uppercase">Nơi Đi (Xuất Hàng)</label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#04147B] focus:ring-1 focus:ring-[#04147B] transition-all"
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  required
                >
                  <option value="" disabled>-- Chọn nơi xuất kho --</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.type})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-center -my-2 relative z-10">
                <div className="bg-white p-2 rounded-full border border-slate-100 shadow-sm text-indigo-400">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>

              {/* Destination List */}
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-indigo-400 tracking-widest uppercase">Xưởng Nhận Hàng</label>
                <select
                  className="w-full px-4 py-3 bg-indigo-50/30 border border-slate-200 rounded-xl text-sm font-bold text-[#04147B] outline-none focus:border-[#04147B] focus:ring-1 focus:ring-[#04147B] transition-all"
                  value={destinationId}
                  onChange={(e) => setDestinationId(e.target.value)}
                  required
                >
                  <option value="" disabled>-- Chọn xưởng nhận hàng --</option>
                  {locations
                    .filter(loc => loc.type === 'WORKSHOP')
                    .map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                </select>
              </div>
            </>
          )}

          <div className="bg-amber-50 rounded-xl p-4 text-xs font-medium text-amber-700 leading-relaxed border border-amber-100">
            <strong>Lưu ý:</strong> Từ phiên quét, hàng sẽ được chuyển từ <b>Kho Admin xuống Xưởng</b>. Luồng tiếp theo (Xưởng → Kho) được thực hiện tại trang Quản lý Điều chuyển.
          </div>
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
            disabled={isSubmitting || isLoading}
            className="flex-1 py-3 bg-[#04147B] hover:bg-[#04147B]/90 text-white shadow-[0_2px_10px_-4px_rgba(4,20,123,0.5)] rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Tạo Điều Chuyển
          </button>
        </div>
      </form>
    </div>
  );
};
