import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useScanSessionStore } from '../../inventory/store/scan-session.store';
import { useTagCacheStore } from '../../inventory/store/tag-cache.store';
import { useReaderScan } from '../../reader/ble/hooks/use-reader-scan';
import { transfersApi } from '../api/transfers.api';
import { TransferData } from '../types';

export function useTransferPicking(selectedTransfer: TransferData | null, onComplete: () => void) {
  const [isSaving, setIsSaving] = useState(false);
  const lastTransferIdRef = useRef<string | null>(null);
  const { scannedTags, clearAll: clearScanSession } = useScanSessionStore();
  const { serverNames } = useTagCacheStore();
  const { isScanning, startScan, stopScan } = useReaderScan();

  // Mỗi khi đổi phiếu điều chuyển, xoá dữ liệu scan cũ để không lẫn với luồng xuất/nhập.
  useEffect(() => {
    const currentTransferId = selectedTransfer?.id || null;
    if (lastTransferIdRef.current === currentTransferId) return;
    lastTransferIdRef.current = currentTransferId;

    clearScanSession();
    stopScan().catch(() => {});
  }, [selectedTransfer?.id]);

  const toggleScan = async () => {
    try {
      if (isScanning) await stopScan();
      else await startScan();
    } catch (e: any) {
      Alert.alert('Lỗi', e.message);
    }
  };

  const getValidTags = () => {
    if (!selectedTransfer) return [];
    // Điều chuyển thường chốt danh sách từng tag đã quét, hoặc tối thiểu đúng tên sản phẩm.
    // Lấy danh sách tên sản phẩm expected từ lệnh chuyển.
    const validProductNames = selectedTransfer.items
      .map(i => i.tag?.epc ? serverNames[i.tag.epc] : null)
      .filter(name => !!name);
    
    return Object.values(scannedTags)
      .filter(t => t.isPresent)
      .map(t => ({ ...t, displayName: serverNames[t.epc] || 'Thẻ chưa có tên' }))
      .filter(t => validProductNames.includes(t.displayName));
  };

  const getProgressInfo = () => {
    if (!selectedTransfer) return { totalItems: 0, scannedItems: 0, isDone: false, sessionCounts: {} };
    
    // Tương tự Order item -> Số lượng yêu cầu 1 (tổng record items).
    // Ở điều chuyển, transfer.items.length chính là tổng lượng thẻ / quy mô hàng hoá.
    const totalItems = selectedTransfer.items.length;
    
    // Lấy số lượng thẻ quét được theo từng sản phẩm
    const validTags = getValidTags();
    const sessionCounts: Record<string, number> = {};
    
    validTags.forEach(t => {
      sessionCounts[t.displayName] = (sessionCounts[t.displayName] || 0) + 1;
    });

    const scannedItems = validTags.length;
    return {
      totalItems,
      scannedItems,
      isDone: scannedItems >= totalItems && totalItems > 0,
       sessionCounts
    };
  };

  const submitReceipt = async () => {
    if (!selectedTransfer) return;
    const { isDone } = getProgressInfo();
    const validTags = getValidTags();

    if (!isDone && validTags.length === 0) {
      Alert.alert('Chưa có dữ liệu', 'Không tìm thấy thẻ RFID hợp lệ cho lệnh luân chuyển này.');
      return;
    }

    if (!isDone) {
      Alert.alert('Chưa quét đủ', 'Bạn cần quét đủ số lượng yêu cầu theo giấy điều chuyển mới được phép nhận hàng.');
      // Comment dòng return lại nếu D-14 cho phép nhận hàng thiếu. Tạm thời nên chặn.
      return; 
    }

    setIsSaving(true);
    try {
      await transfersApi.confirmTransfer(selectedTransfer.id, validTags.map(t => ({ epc: t.epc })));
      Alert.alert('Thành công', 'Đã lưu xác nhận nhận hàng luân chuyển xuống Server.', [{ text: 'OK', onPress: onComplete }]);
    } catch (e: any) {
      Alert.alert('Lỗi', e.message || 'Không thể hoàn tất giao dịch. Hãy kiểm tra kết nối mạng.');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    isScanning,
    toggleScan,
    submitReceipt,
    clearScanSession,
    getValidTags,
    getProgressInfo
  };
}
