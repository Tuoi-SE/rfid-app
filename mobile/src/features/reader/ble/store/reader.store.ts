import { create } from 'zustand';
import { Device } from 'react-native-ble-plx';

interface ReaderState {
  status: 'disconnected' | 'scanning' | 'connected' | 'error';
  foundDevices: Device[];
  connectedDevice: Device | null;
  isScanningInventory: boolean;

  setStatus: (status: ReaderState['status']) => void;
  addDevice: (device: Device) => void;
  setConnectedDevice: (device: Device | null) => void;
  setIsScanning: (isScanning: boolean) => void;
  clearDevices: () => void;
}

export const useReaderStore = create<ReaderState>((set) => ({
  status: 'disconnected',
  foundDevices: [],
  connectedDevice: null,
  isScanningInventory: false,

  setStatus: status => set({ status }),
  addDevice: device => set(state => ({
    foundDevices: [
      ...state.foundDevices.filter(d => d.id !== device.id),
      device
    ]
  })),
  setConnectedDevice: device => set({ connectedDevice: device }),
  setIsScanning: isScanning => set({ isScanningInventory: isScanning }),
  clearDevices: () => set({ foundDevices: [] }),
}));
