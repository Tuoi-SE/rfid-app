import { useState } from 'react';
import { bleReaderService } from '../services/ble-reader.service';
import { useReaderStore } from '../store/reader.store';
import { RFIDTag } from '../types';

export function useReaderConnection() {
  const { setStatus, addDevice, setConnectedDevice, clearDevices, status } = useReaderStore();

  const scanDevices = async () => {
    const hasPermission = await bleReaderService.requestPermissions();
    if (!hasPermission) {
      throw new Error('Bluetooth permissions denied');
    }

    clearDevices();
    setStatus('scanning');

    await bleReaderService.scanDevices(
      (device) => addDevice(device as any),
      (error) => {
        setStatus('error');
        throw error;
      }
    );

    setStatus('disconnected');
  };

  const connectToDevice = async (device: { id: string }, onTagRead: (tag: RFIDTag) => void) => {
    setStatus('scanning'); // using 'scanning' as a proxy for 'connecting' since we don't have 'connecting'
    try {
      await bleReaderService.connect(device, onTagRead);
      setConnectedDevice(device as any);
      setStatus('connected');
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
