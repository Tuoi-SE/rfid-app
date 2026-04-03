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
  flushPendingTags: () => void;
  startNewSession: () => void;
  clearAll: () => void;
  saveToStorage: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

// === Option A: Batch buffer ===
// Gom tag vào buffer ngoài store, flush vào Zustand mỗi 300ms
// → UI chỉ re-render tối đa 3 lần/giây thay vì hàng trăm lần
const FLUSH_INTERVAL = 300;
let tagBuffer: Map<string, { epc: string; rssi: number }> = new Map();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function flushBufferedTags() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  const batch = tagBuffer;
  tagBuffer = new Map();
  if (batch.size === 0) return;

  useScanSessionStore.setState(state => {
    const updated = { ...state.scannedTags };
    const now = new Date();
    for (const [epc, { rssi }] of batch) {
      const existing = updated[epc];
      updated[epc] = existing ? {
        ...existing,
        rssi,
        scanCount: existing.scanCount + 1,
        lastScanTime: now,
        isPresent: true,
      } : {
        epc,
        rssi,
        scanCount: 1,
        firstScanTime: now,
        lastScanTime: now,
        isPresent: true,
      };
    }
    return { scannedTags: updated };
  });
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushBufferedTags();
  }, FLUSH_INTERVAL);
}

export const useScanSessionStore = create<ScanSessionState>((set, get) => ({
  scannedTags: {},
  
  addOrUpdateTag: (epc, rssi) => {
    // Ghi vào buffer thay vì cập nhật Zustand trực tiếp
    tagBuffer.set(epc, { epc, rssi });
    scheduleFlush();
  },

  flushPendingTags: () => {
    flushBufferedTags();
  },

  startNewSession: () => set(state => {
    const updated = Object.fromEntries(
      Object.entries(state.scannedTags).map(([k, v]) => [k, { ...v, isPresent: false }])
    );
    return { scannedTags: updated };
  }),

  clearAll: () => {
    tagBuffer.clear();
    if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
    set({ scannedTags: {} });
  },

  saveToStorage: async () => {
    await AsyncStorage.setItem('rfid_session', JSON.stringify(get().scannedTags));
  },

  loadFromStorage: async () => {
    const raw = await AsyncStorage.getItem('rfid_session');
    if (raw) set({ scannedTags: JSON.parse(raw) });
  },
}));
