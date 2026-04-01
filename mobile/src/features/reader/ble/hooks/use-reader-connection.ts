import { bleReaderService } from '../services/ble-reader.service';
import { useReaderStore } from '../store/reader.store';
import { RFIDTag } from '../types';

export function useReaderConnection() {
  const { setStatus, addDevice, setConnectedDevice, clearDevices, status } = useReaderStore();

  const syncStatusWithConnection = () => {
    const { connectedDevice } = useReaderStore.getState();
    setStatus(connectedDevice || bleReaderService.isConnected() ? 'connected' : 'disconnected');
  };

  const scanDevices = async () => {
    const hasPermission = await bleReaderService.requestPermissions();
    if (!hasPermission) {
      throw new Error('Bluetooth permissions denied');
    }

    clearDevices();
    setStatus('scanning');
    let scanError: Error | null = null;

    await bleReaderService.scanDevices(
      (device) => addDevice(device as any),
      (error) => {
        const { connectedDevice } = useReaderStore.getState();
        if (connectedDevice || bleReaderService.isConnected()) {
          return;
        }
        setStatus('error');
        scanError = error;
      }
    );

    if (scanError) {
      throw scanError;
    }

    syncStatusWithConnection();
  };

  const connectToDevice = async (device: { id: string }, onTagRead: (tag: RFIDTag) => void) => {
    setStatus('scanning'); // using 'scanning' as a proxy for 'connecting' since we don't have 'connecting'
    try {
      await bleReaderService.connect(device, onTagRead);
      setConnectedDevice(device as any);
      syncStatusWithConnection();
    } catch (error) {
      setStatus('error');
      throw error;
    }
  };

  const disconnect = async () => {
    await bleReaderService.disconnect();
    setConnectedDevice(null);
    setStatus('disconnected');
  };

  return {
    scanDevices,
    connectToDevice,
    disconnect,
    isScanning: status === 'scanning',
    isConnected: status === 'connected',
  };
}
