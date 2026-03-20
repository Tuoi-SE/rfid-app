// src/store/bleStore.ts
import { create } from 'zustand';
import { Device } from 'react-native-ble-plx';

interface BLEState {
  trangThai: 'chua_ket_noi' | 'dang_quet' | 'da_ket_noi' | 'loi';
  thietBiTimThay: Device[];
  thietBiDaKetNoi: Device | null;
  dangQuetInventory: boolean;

  setTrangThai: (tt: BLEState['trangThai']) => void;
  themThietBi: (device: Device) => void;
  setThietBiKetNoi: (device: Device | null) => void;
  setDangQuet: (dang: boolean) => void;
  xoaDanhSachThietBi: () => void;
}

export const useBLEStore = create<BLEState>((set) => ({
  trangThai: 'chua_ket_noi',
  thietBiTimThay: [],
  thietBiDaKetNoi: null,
  dangQuetInventory: false,

  setTrangThai: tt => set({ trangThai: tt }),
  themThietBi: device => set(state => ({
    thietBiTimThay: [
      ...state.thietBiTimThay.filter(d => d.id !== device.id),
      device
    ]
  })),
  setThietBiKetNoi: device => set({ thietBiDaKetNoi: device }),
  setDangQuet: dang => set({ dangQuetInventory: dang }),
  xoaDanhSachThietBi: () => set({ thietBiTimThay: [] }),
}));
