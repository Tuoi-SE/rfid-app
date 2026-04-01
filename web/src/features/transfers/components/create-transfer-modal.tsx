import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { X, Loader2, ArrowRight } from 'lucide-react';
import { httpClient } from '@/lib/http/client';
import { TransferType, type TransferLocation } from '../types';
import toast from 'react-hot-toast';

interface TransferSessionLite {
  id: string;
  name: string;
  totalTags: number;
}

interface SessionTagRow {
  tagId: string;
  epc?: string;
  locationId?: string | null;
  scannedAt?: string | null;
  sessionId: string;
}

interface SessionScan {
  tag?: {
    id?: string;
    epc?: string;
    locationId?: string | null;
  } | null;
  tagEpc?: string;
  scannedAt?: string | null;
}

interface PendingTransferResponse {
  items?: Array<{ tagId?: string | null }>;
}

interface TransferValidationErrorDetail {
  reason?: 'TAG_NOT_FOUND' | 'TAG_IN_PENDING_TRANSFER' | 'TAG_NOT_AT_SOURCE' | 'TAG_ALREADY_COMPLETED_ROUTE';
}

interface CreateTransferModalProps {
  sessions: TransferSessionLite[];
  onClose: () => void;
  onSuccess: () => void;
}

const getTimestamp = (value?: string | null) => {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const parseLocationList = (payload: unknown): TransferLocation[] => {
  if (Array.isArray(payload)) return payload as TransferLocation[];
  if (!isObjectRecord(payload)) return [];

  const directItems = payload.items;
  if (Array.isArray(directItems)) return directItems as TransferLocation[];

  const data = payload.data;
  if (Array.isArray(data)) return data as TransferLocation[];
  if (isObjectRecord(data) && Array.isArray(data.items)) {
    return data.items as TransferLocation[];
  }
  return [];
};

const parseSessionScans = (payload: unknown): SessionScan[] => {
  if (isObjectRecord(payload) && Array.isArray(payload.scans)) {
    return payload.scans as SessionScan[];
  }
  if (isObjectRecord(payload) && isObjectRecord(payload.data) && Array.isArray(payload.data.scans)) {
    return payload.data.scans as SessionScan[];
  }
  return [];
};

const parsePendingTransfers = (payload: unknown): PendingTransferResponse[] => {
  if (Array.isArray(payload)) return payload as PendingTransferResponse[];
  if (!isObjectRecord(payload)) return [];

  if (Array.isArray(payload.items)) return payload.items as PendingTransferResponse[];
  if (Array.isArray(payload.data)) return payload.data as PendingTransferResponse[];
  if (isObjectRecord(payload.data) && Array.isArray(payload.data.items)) {
    return payload.data.items as PendingTransferResponse[];
  }
  return [];
};

const buildTransferValidationHint = (errorPayload: unknown): string => {
  if (!isObjectRecord(errorPayload)) return '';
  const errorPart = errorPayload.error;
  if (!isObjectRecord(errorPart) || errorPart.code !== 'TRANSFER_TAG_VALIDATION_FAILED') return '';

  const details = errorPart.details;
  if (!isObjectRecord(details) || !Array.isArray(details.blockedTags)) return '';

  const blocked = details.blockedTags as TransferValidationErrorDetail[];
  if (blocked.length === 0) return '';

  const reasonCounter = blocked.reduce<Record<string, number>>((acc, item) => {
    const reason = item.reason || 'UNKNOWN';
    acc[reason] = (acc[reason] || 0) + 1;
    return acc;
  }, {});

  const segments = [
    reasonCounter.TAG_IN_PENDING_TRANSFER ? `${reasonCounter.TAG_IN_PENDING_TRANSFER} tag đang PENDING` : null,
    reasonCounter.TAG_NOT_AT_SOURCE ? `${reasonCounter.TAG_NOT_AT_SOURCE} tag không ở source` : null,
    reasonCounter.TAG_ALREADY_COMPLETED_ROUTE ? `${reasonCounter.TAG_ALREADY_COMPLETED_ROUTE} tag đã hoàn tất tuyến` : null,
    reasonCounter.TAG_NOT_FOUND ? `${reasonCounter.TAG_NOT_FOUND} tag không tồn tại` : null,
  ].filter(Boolean);

  return segments.length > 0 ? `\nChi tiết: ${segments.join(', ')}.` : '';
};

export const CreateTransferModal = ({ sessions, onClose, onSuccess }: CreateTransferModalProps) => {
  const [locations, setLocations] = useState<TransferLocation[]>([]);
  const [sessionTags, setSessionTags] = useState<SessionTagRow[]>([]);
  const [missingTagIdCount, setMissingTagIdCount] = useState(0);
  const [pendingTagIds, setPendingTagIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [sourceId, setSourceId] = useState<string>('');
  const [destinationId, setDestinationId] = useState<string>('');

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setIsLoading(true);

        const [locationsRes, pendingRes, ...sessionResponses] = await Promise.all([
          httpClient('/locations?limit=100'),
          httpClient('/transfers?status=PENDING&limit=500'),
          ...sessions.map((session) => httpClient(`/sessions/${session.id}`)),
        ]);

        const locs = parseLocationList(locationsRes);
        const rows: SessionTagRow[] = [];
        let missingCount = 0;

        sessionResponses.forEach((sessionResponse, index: number) => {
          const scans = parseSessionScans(sessionResponse);
          const sessionId = sessions[index]?.id || '';

          scans.forEach((scan) => {
            const tagId = scan?.tag?.id;
            if (!tagId) {
              missingCount += 1;
              return;
            }

            rows.push({
              tagId,
              epc: scan?.tag?.epc || scan?.tagEpc,
              locationId: scan?.tag?.locationId || null,
              scannedAt: scan?.scannedAt || null,
              sessionId,
            });
          });
        });

        const pendingTransfers = parsePendingTransfers(pendingRes);

        const pendingIds = new Set<string>();
        pendingTransfers.forEach((transfer) => {
          (transfer?.items || []).forEach((item) => {
            if (item?.tagId) pendingIds.add(item.tagId);
          });
        });

        if (mounted) {
          setLocations(locs);
          setSessionTags(rows);
          setMissingTagIdCount(missingCount);
          setPendingTagIds(pendingIds);

          const adminLocationIds = new Set(
            locs.filter((location) => location.type === 'ADMIN').map((location) => location.id),
          );
          const adminSourceCounter = new Map<string, number>();

          rows.forEach((row) => {
            if (!row.locationId || !adminLocationIds.has(row.locationId)) return;
            adminSourceCounter.set(row.locationId, (adminSourceCounter.get(row.locationId) || 0) + 1);
          });

          const preferredAdminSourceId = Array.from(adminSourceCounter.entries())
            .sort((a, b) => b[1] - a[1])[0]?.[0];
          const fallbackAdminSourceId = locs.find((location) => location.type === 'ADMIN')?.id;

          if (preferredAdminSourceId) {
            setSourceId(preferredAdminSourceId);
          } else if (fallbackAdminSourceId) {
            setSourceId(fallbackAdminSourceId);
          } else {
            setSourceId('');
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadData();
    return () => { mounted = false; };
  }, [sessions]);

  const mergeSummary = useMemo(() => {
    const grouped = new Map<string, SessionTagRow[]>();
    sessionTags.forEach((row) => {
      grouped.set(row.tagId, [...(grouped.get(row.tagId) || []), row]);
    });

    const duplicateTagIds = Array.from(grouped.entries())
      .filter(([, rows]) => rows.length > 1)
      .map(([tagId]) => tagId);

    const chosenRows = new Map<string, SessionTagRow>();
    grouped.forEach((rows, tagId) => {
      const chosen = [...rows].sort((a, b) => getTimestamp(b.scannedAt) - getTimestamp(a.scannedAt))[0];
      chosenRows.set(tagId, chosen);
    });

    const sourceLocation = locations.find((location) => location.id === sourceId);
    const allowUnknownSourceForAdminFlow = sourceLocation?.type === 'ADMIN';

    const sourceMismatchTagIds = Array.from(chosenRows.entries())
      .filter(([, row]) => {
        if (!sourceId) return false;
        if (!row.locationId) return !allowUnknownSourceForAdminFlow;
        return row.locationId !== sourceId;
      })
      .map(([tagId]) => tagId);

    const unknownLocationCount = Array.from(chosenRows.values()).filter((row) => !row.locationId).length;

    const pendingConflictTagIds = Array.from(chosenRows.keys()).filter((tagId) => pendingTagIds.has(tagId));
    const blocked = new Set([...sourceMismatchTagIds, ...pendingConflictTagIds]);
    const eligibleTagIds = Array.from(chosenRows.keys()).filter((tagId) => !blocked.has(tagId));

    return {
      rawTagCount: sessionTags.length,
      uniqueTagCount: grouped.size,
      duplicateTagCount: duplicateTagIds.length,
      sourceMismatchCount: sourceMismatchTagIds.length,
      pendingConflictCount: pendingConflictTagIds.length,
      unknownLocationCount,
      eligibleTagIds,
    };
  }, [sessionTags, sourceId, pendingTagIds, locations]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!sourceId || !destinationId) return toast.error('Vui lòng chọn đầy đủ nơi xuất và nơi nhận!');
    if (sourceId === destinationId) return toast.error('Nơi xuất và nơi nhận không được trùng nhau!');
    if (mergeSummary.eligibleTagIds.length === 0) return toast.error('Không có tag hợp lệ để tạo phiếu điều chuyển.');
    if (mergeSummary.sourceMismatchCount > 0) {
      return toast.error(`Có ${mergeSummary.sourceMismatchCount} tag không thuộc đúng nơi xuất đã chọn. Vui lòng đổi nơi xuất hoặc rà soát lại phiên.`);
    }
    if (mergeSummary.pendingConflictCount > 0) {
      return toast.error(`Có ${mergeSummary.pendingConflictCount} tag đang PENDING tại phiếu khác. Vui lòng kiểm tra lại.`);
    }

    const sourceLocation = locations.find(l => l.id === sourceId);
    const destLocation = locations.find(l => l.id === destinationId);
    const destinationType = destLocation?.type ?? '';

    // Determine type
    let type: TransferType = 'ADMIN_TO_WORKSHOP';
    if (sourceLocation?.type === 'ADMIN' && destLocation?.type === 'WORKSHOP') {
      type = 'ADMIN_TO_WORKSHOP';
    } else if (sourceLocation?.type === 'WORKSHOP_WAREHOUSE' && destLocation?.type === 'WAREHOUSE') {
      type = 'WORKSHOP_TO_WAREHOUSE';
    } else if (sourceLocation?.type === 'WAREHOUSE' && ['HOTEL', 'SPA', 'RESORT'].includes(destinationType)) {
      type = 'WAREHOUSE_TO_CUSTOMER';
    } else {
      return toast.error(`Tuyến không hợp lệ: ${sourceLocation?.type} -> ${destLocation?.type}`);
    }

    setIsSubmitting(true);
    try {
      // Post transfer with deduped + conflict-free tags
      await httpClient('/transfers', {
        method: 'POST',
        body: JSON.stringify({
          type,
          sourceId,
          destinationId,
          tagIds: mergeSummary.eligibleTagIds
        })
      });

      toast.success(
        `Khởi tạo Luân Chuyển thành công cho ${mergeSummary.eligibleTagIds.length} tag.`,
      );
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể tạo phiếu điều chuyển.';
      const payload =
        isObjectRecord(err) && 'data' in err
          ? (err as { data?: unknown }).data
          : undefined;
      const hint = buildTransferValidationHint(payload);
      toast.error(`Lỗi: ${message}${hint}`);
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
              Phân bổ {mergeSummary.uniqueTagCount || sessions.reduce((sum, s) => sum + (s.totalTags || 0), 0)} tags từ {sessions.length > 1 ? `${sessions.length} phiên đã chọn` : `phiên "${sessions[0]?.name || ''}"`}
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
                  {locations.filter((loc) => loc.type === 'ADMIN').map(loc => (
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

          <div className="bg-slate-50 rounded-xl p-4 text-xs font-medium text-slate-600 leading-relaxed border border-slate-200">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <div>Tổng bản ghi quét: <b className="text-slate-800">{mergeSummary.rawTagCount}</b></div>
              <div>Tag duy nhất: <b className="text-slate-800">{mergeSummary.uniqueTagCount}</b></div>
              <div>Tag trùng giữa phiên: <b className="text-slate-800">{mergeSummary.duplicateTagCount}</b></div>
              <div>Thiếu mã tag ID: <b className="text-slate-800">{missingTagIdCount}</b></div>
              <div>Tag chưa có source: <b className={mergeSummary.unknownLocationCount ? 'text-amber-600' : 'text-slate-800'}>{mergeSummary.unknownLocationCount}</b></div>
              <div>Tag sai source: <b className={mergeSummary.sourceMismatchCount ? 'text-red-600' : 'text-slate-800'}>{mergeSummary.sourceMismatchCount}</b></div>
              <div>Tag đang PENDING: <b className={mergeSummary.pendingConflictCount ? 'text-red-600' : 'text-slate-800'}>{mergeSummary.pendingConflictCount}</b></div>
            </div>
            <div className="mt-2">
              Tag hợp lệ để tạo phiếu: <b className="text-[#04147B]">{mergeSummary.eligibleTagIds.length}</b>
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-4 text-xs font-medium text-amber-700 leading-relaxed border border-amber-100">
            <strong>Lưu ý:</strong> Hệ thống sẽ tự gộp tag từ nhiều phiên, dedupe tag trùng theo <b>tagId</b>, và chỉ gửi các tag hợp lệ vào phiếu điều chuyển.
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
            disabled={isSubmitting || isLoading || mergeSummary.eligibleTagIds.length === 0 || mergeSummary.sourceMismatchCount > 0 || mergeSummary.pendingConflictCount > 0}
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
