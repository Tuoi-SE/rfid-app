import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ScanTagItem {
  epc: string;
  rssi: number;
  scanCount: number;
  firstScanTime: Date;
  lastScanTime: Date;
  isPresent: boolean;
}

interface ScanSessionState {
  scannedTags: Record<string, ScanTagItem>;
  addOrUpdateTag: (epc: string, rssi: number) => void;
  startNewSession: () => void;
  clearAll: () => void;
  saveToStorage: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useScanSessionStore = create<ScanSessionState>((set, get) => ({
  scannedTags: {},
  
  addOrUpdateTag: (epc, rssi) => set(state => {
    const existing = state.scannedTags[epc];
    return {
      scannedTags: {
        ...state.scannedTags,
        [epc]: existing ? {
          ...existing,
          rssi,
          scanCount: existing.scanCount + 1,
          lastScanTime: new Date(),
          isPresent: true,
        } : {
          epc,
          rssi,
          scanCount: 1,
          firstScanTime: new Date(),
          lastScanTime: new Date(),
          isPresent: true,
        }
      }
    };
  }),

  startNewSession: () => set(state => {
    const updated = Object.fromEntries(
      Object.entries(state.scannedTags).map(([k, v]) => [k, { ...v, isPresent: false }])
    );
    return { scannedTags: updated };
  }),

  clearAll: () => set({ scannedTags: {} }),

  saveToStorage: async () => {
    await AsyncStorage.setItem('rfid_session', JSON.stringify(get().scannedTags));
  },

  loadFromStorage: async () => {
    const raw = await AsyncStorage.getItem('rfid_session');
    if (raw) set({ scannedTags: JSON.parse(raw) });
  },
}));
