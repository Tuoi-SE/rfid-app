import { useState } from 'react';
import { Alert } from 'react-native';
import { useScanSessionStore } from '../../inventory/store/scan-session.store';
import { useTagCacheStore } from '../../inventory/store/tag-cache.store';
import { useReaderScan } from '../../reader/ble/hooks/use-reader-scan';
import { ordersApi } from '../api/orders.api';
import { Order } from '../types';

export function useTransactionPicking(selectedOrder: Order | null, onComplete: () => void) {
  const [isSaving, setIsSaving] = useState(false);
  const { scannedTags, clearAll: clearScanSession } = useScanSessionStore();
  const { serverNames } = useTagCacheStore();
  const { isScanning, startScan, stopScan } = useReaderScan();

  const toggleScan = async () => {
    try {
      if (isScanning) await stopScan();
      else await startScan();
    } catch (e: any) {
      Alert.alert('Lỗi', e.message);
    }
  };

  const getValidTags = () => {
    if (!selectedOrder) return [];
    const validProductNames = selectedOrder.items.map(i => i.product.name);
    
    return Object.values(scannedTags)
      .filter(t => t.isPresent)
      .map(t => ({ ...t, displayName: serverNames[t.epc] || 'Thẻ chưa có tên' }))
      .filter(t => validProductNames.includes(t.displayName));
  };

  const submitSession = async () => {
    if (!selectedOrder) return;
    const validTags = getValidTags();

    if (validTags.length === 0) {
      Alert.alert('Chưa có dữ liệu hợp lệ', 'Không tìm thấy thẻ nào khớp với đơn hàng. Vui lòng quét thẻ đúng sản phẩm.');
      return;
    }

    setIsSaving(true);
    try {
      await ordersApi.pushSession({
        name: selectedOrder.type === 'INBOUND' ? `Nhập kho ${selectedOrder.code}` : `Xuất kho ${selectedOrder.code}`,
        orderId: selectedOrder.id,
        scans: validTags.map(t => ({ epc: t.epc, rssi: t.rssi, time: new Date(t.lastScanTime) }))
      });
      
      Alert.alert('Thành công', 'Đã lưu kết quả giao dịch về Server.', [{ text: 'OK', onPress: onComplete }]);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể hoàn tất giao dịch. Hãy kiểm tra mạng.');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    isScanning,
    toggleScan,
    submitSession,
    clearScanSession,
    getValidTags
  };
}
