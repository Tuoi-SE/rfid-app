import { bleReaderService } from '../services/ble-reader.service';
import { useReaderStore } from '../store/reader.store';

export function useReaderScan() {
  const { setIsScanning, isScanningInventory } = useReaderStore();

  const startScan = async () => {
    try {
      await bleReaderService.startInventory();
      setIsScanning(true);
    } catch (error) {
      console.error('Failed to start scan:', error);
      throw error;
    }
  };

  const stopScan = async () => {
    try {
      await bleReaderService.stopInventory();
      setIsScanning(false);
    } catch (error) {
      console.error('Failed to stop scan:', error);
      throw error;
    }
  };

  return {
    startScan,
    stopScan,
    isScanning: isScanningInventory,
  };
}
