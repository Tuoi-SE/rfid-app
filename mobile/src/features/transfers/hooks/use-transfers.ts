import { useState, useEffect, useCallback } from 'react';
import { TransferData } from '../types';
import { transfersApi } from '../api/transfers.api';
import { useAuthStore } from '../../auth/store/auth.store';

export function useTransfers() {
  const [transfers, setTransfers] = useState<TransferData[]>([]);
  const [loading, setLoading] = useState(true);
  const { username } = useAuthStore();

  const fetchTransfers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await transfersApi.pullTransfers();
      
      // Cho phép WAREHOUSE_MANAGER thấy các lệnh Điều Chuyển (PENDING)
      // có thể lọc locationId nếu D-14 support, tạm thời lấy tất cả PENDING.
      setTransfers(data.filter(t => t.status === 'PENDING'));
    } catch (e: any) {
      console.warn('[useTransfers] Lỗi tải danh sách điều chuyển:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransfers();
    // Auto-refresh periodically (e.g., 5s) to get immediate updates when admin dispatches
    const interval = setInterval(fetchTransfers, 5000);
    return () => clearInterval(interval);
  }, [fetchTransfers]);

  return { transfers, loading, refetch: fetchTransfers };
}
