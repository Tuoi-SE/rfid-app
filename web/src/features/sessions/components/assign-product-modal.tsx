import React, { useMemo, useState } from 'react';
import { X, Search, AlertCircle, PackagePlus, Box, Check } from 'lucide-react';
import { SessionData } from '../types';
import { useProducts } from '@/features/products/hooks/use-products';
import { useAssignSessionProduct } from '../hooks/use-assign-session-product';
import { useSessionDetail } from '../hooks/use-sessions';
import { AssignSessionStrategy } from '../api/assign-session-product';
import toast from 'react-hot-toast';

interface ProductOption {
  id: string;
  name: string;
  sku?: string;
  category?: { name?: string } | null;
}

interface SessionDetailScan {
  tag?: {
    productId?: string | null;
    product?: { id?: string | null } | null;
  } | null;
}

interface SessionDetailPayload {
  scans?: SessionDetail[];
}

type SessionDetail = SessionDetailScan;

interface AssignProductModalProps {
  session: SessionData;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AssignProductModal = ({ session, onClose, onSuccess }: AssignProductModalProps) => {
  const [search, setSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<AssignSessionStrategy | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lấy danh sách sản phẩm
  const { data, isLoading } = useProducts(search ? `limit=50&search=${search}` : 'limit=50');
  const { data: detailData, isLoading: isDetailLoading } = useSessionDetail(session.id);
  const rawProducts = (data as { data?: { items?: unknown } } | undefined)?.data?.items || data || [];
  const products: ProductOption[] = Array.isArray(rawProducts) ? (rawProducts as ProductOption[]) : [];

  const sessionDetail = useMemo<SessionDetailPayload>(() => {
    const dataWithWrapper = detailData as { data?: unknown } | undefined;
    const payload = dataWithWrapper?.data ?? detailData;
    if (payload && typeof payload === 'object') {
      return payload as SessionDetailPayload;
    }
    return {};
  }, [detailData]);

  const { mutateAsync: assignSessionProduct } = useAssignSessionProduct();

  const assignmentSummary = useMemo(() => {
    const scans = Array.isArray(sessionDetail.scans) ? sessionDetail.scans : [];
    const totalInSession = scans.length || session.totalTags || 0;
    const assignedScans = scans.filter((scan) => Boolean(scan?.tag?.productId || scan?.tag?.product?.id));
    const assignedCount = assignedScans.length;
    const unassignedCount = Math.max(totalInSession - assignedCount, 0);
    const assignedProductIds = Array.from(
      new Set(
        assignedScans
          .map((scan) => scan?.tag?.productId || scan?.tag?.product?.id)
          .filter((id: unknown): id is string => typeof id === 'string' && id.length > 0),
      ),
    );

    return {
      totalInSession,
      assignedCount,
      unassignedCount,
      assignedProductIds,
      hasMixed: assignedCount > 0 && unassignedCount > 0,
    };
  }, [sessionDetail, session.totalTags]);

  const effectiveStrategy: AssignSessionStrategy | null = assignmentSummary.hasMixed
    ? selectedStrategy
    : assignmentSummary.unassignedCount > 0
      ? 'UNASSIGNED_ONLY'
      : 'OVERWRITE_ALL';

  const isOverwriteSameProduct =
    effectiveStrategy === 'OVERWRITE_ALL' &&
    !!selectedProductId &&
    assignmentSummary.assignedProductIds.length > 0 &&
    !assignmentSummary.assignedProductIds.some((id) => id !== selectedProductId);

  const handleAssign = async () => {
    if (!selectedProductId) return;
    if (!effectiveStrategy) {
      toast.error('Vui lòng chọn cách đồng bộ: chỉ gán thẻ chưa gán hoặc gán đè toàn bộ.');
      return;
    }
    if (isOverwriteSameProduct) {
      toast.error('Đồng bộ toàn bộ yêu cầu chọn sản phẩm khác với sản phẩm đang gán hiện tại.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const res = await assignSessionProduct({
        sessionId: session.id,
        productId: selectedProductId,
        strategy: effectiveStrategy,
      });
      const payload = (res as { data?: { count?: number } }).data ?? {};
      const affectedCount = payload?.count || session.totalTags;
      const successText =
        effectiveStrategy === 'UNASSIGNED_ONLY'
          ? `Đã gán thành công ${affectedCount} thẻ chưa gán trong phiên.`
          : `Đã đồng bộ thành công toàn bộ ${affectedCount} thẻ theo sản phẩm mới.`;
      toast.success(successText);
      onSuccess?.();
    } catch (err: unknown) {
      const fallbackMessage = 'Không thể gán sản phẩm';
      const message =
        err instanceof Error
          ? err.message
          : (typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message?: unknown }).message === 'string'
              ? (err as { message: string }).message
              : fallbackMessage);

      toast.error(`Lỗi: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative my-4 sm:my-6 bg-white rounded-[24px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col min-h-0 max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[#04147B]">
              <PackagePlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Gán Sản Phẩm Hàng Loạt</h2>
              <p className="text-sm font-medium text-slate-500 mt-0.5">
                Phiên: <span className="text-[#04147B] font-bold">{session.name}</span> • <span className="text-slate-700">{session.totalTags.toLocaleString()} thẻ</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors font-medium"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 pb-2">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm theo tên hoặc mã SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#04147B]/20 focus:border-[#04147B] transition-all text-[15px] font-medium placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="px-6 pb-1">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-slate-600">
            <span className="font-semibold text-slate-800">Tổng thẻ trong phiên:</span> {assignmentSummary.totalInSession}
            <span className="mx-2 text-slate-300">•</span>
            <span className="font-semibold text-slate-800">Đã gán:</span> {assignmentSummary.assignedCount}
            <span className="mx-2 text-slate-300">•</span>
            <span className="font-semibold text-slate-800">Chưa gán:</span> {assignmentSummary.unassignedCount}
          </div>
        </div>

        {assignmentSummary.hasMixed && (
          <div className="px-6 py-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900 mb-3">
                Phiên này có cả thẻ đã gán và chưa gán. Bạn phải chọn một cách xử lý:
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStrategy('UNASSIGNED_ONLY')}
                  className={`text-left rounded-lg border px-3 py-2 text-sm transition-colors ${
                    selectedStrategy === 'UNASSIGNED_ONLY'
                      ? 'border-[#04147B] bg-indigo-50 text-[#04147B] font-semibold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Chỉ gán {assignmentSummary.unassignedCount} thẻ chưa gán
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStrategy('OVERWRITE_ALL')}
                  className={`text-left rounded-lg border px-3 py-2 text-sm transition-colors ${
                    selectedStrategy === 'OVERWRITE_ALL'
                      ? 'border-[#04147B] bg-indigo-50 text-[#04147B] font-semibold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Đồng bộ toàn bộ {assignmentSummary.totalInSession} thẻ sang sản phẩm khác
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Product List */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="w-8 h-8 border-3 border-slate-200 border-t-[#04147B] rounded-full animate-spin" />
              <p className="text-sm text-slate-500 font-medium">Đang tải danh sách sản phẩm...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => setSelectedProductId(product.id)}
                  className={`flex items-center p-4 rounded-xl border-2 text-left transition-all group ${
                    selectedProductId === product.id 
                      ? 'border-[#04147B] bg-indigo-50/50 shadow-[0_4px_20px_rgb(4,20,123,0.08)]' 
                      : 'border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-[10px] flex items-center justify-center shrink-0 mr-4 transition-colors ${
                    selectedProductId === product.id ? 'bg-[#04147B] text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                  }`}>
                    <Box className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-bold text-slate-900 truncate">{product.name}</h3>
                    <p className="text-[13px] font-medium text-slate-500 mt-1">
                      SKU: <span className="text-slate-700">{product.sku || 'N/A'}</span>
                      {product.category?.name && <span className="mx-1.5 text-slate-300">•</span>}
                      {product.category?.name && `Danh mục: ${product.category.name}`}
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ml-4 shrink-0 transition-all ${
                    selectedProductId === product.id ? 'border-[#04147B] bg-[#04147B] scale-110' : 'border-slate-300 group-hover:border-slate-400 group-hover:bg-slate-100'
                  }`}>
                    {selectedProductId === product.id && <Check className="w-3.5 h-3.5 text-white" strokeWidth={4} />}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4">
                <Box className="w-8 h-8" />
              </div>
              <p className="text-slate-500 font-medium text-lg tracking-tight">Không tìm thấy sản phẩm nào</p>
              <p className="text-slate-400 text-sm mt-1">Hãy thử tìm kiếm với từ khóa khác</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/80 mt-auto">
          {selectedProductId && (
            <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl border border-amber-200/60 mb-6 animate-in slide-in-from-bottom-2 duration-300">
              <div className="bg-amber-100 p-2 rounded-lg shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-sm text-amber-800 leading-relaxed font-medium pt-1">
                {effectiveStrategy === 'UNASSIGNED_ONLY'
                  ? <>Chỉ <b className="text-amber-900">{assignmentSummary.unassignedCount.toLocaleString()} thẻ chưa gán</b> sẽ được cập nhật theo sản phẩm đã chọn.</>
                  : <>Toàn bộ <b className="text-amber-900">{assignmentSummary.totalInSession.toLocaleString()} thẻ</b> trong phiên sẽ đồng bộ sang sản phẩm đã chọn.</>}
              </div>
            </div>
          )}

          {isOverwriteSameProduct && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              Chế độ đồng bộ toàn bộ yêu cầu chọn sản phẩm khác với sản phẩm hiện đang gán cho các thẻ đã có dữ liệu.
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition-colors"
            >
              Huỷ bỏ
            </button>
            <button
              onClick={handleAssign}
              disabled={!selectedProductId || isSubmitting || isDetailLoading || !effectiveStrategy || isOverwriteSameProduct}
              className="px-8 py-3 rounded-xl font-bold text-white bg-[#04147B] hover:bg-[#04147B]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#04147B]/20 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  Xác nhận Gán
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
