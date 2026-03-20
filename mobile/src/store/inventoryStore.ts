// src/store/inventoryStore.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TagItem {
  epc: string;
  tenHienThi: string;   // Tên lấy từ server hoặc tự đặt
  rssi: number;
  soLanQuet: number;
  lanQuetDau: Date;
  lanQuetCuoi: Date;
  coMat: boolean;
}

interface InventoryState {
  tags: Record<string, TagItem>;
  tenTuServer: Record<string, string>; // EPC → Tên từ server

  themHoacCapNhatTag: (epc: string, rssi: number) => void;
  capNhatTenTuServer: (tenMap: Record<string, string>) => void;
  doiTen: (epc: string, tenMoi: string) => void;
  batDauPhienMoi: () => void;
  xoaTatCa: () => void;
  luuVaoBo: () => Promise<void>;
  taiTuBo: () => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  tags: {},
  tenTuServer: {},

  themHoacCapNhatTag: (epc, rssi) => set(state => {
    const tenServer = state.tenTuServer[epc];
    const tagCu = state.tags[epc];
    return {
      tags: {
        ...state.tags,
        [epc]: tagCu ? {
          ...tagCu,
          rssi,
          soLanQuet: tagCu.soLanQuet + 1,
          lanQuetCuoi: new Date(),
          coMat: true,
        } : {
          epc,
          tenHienThi: tenServer || `Thẻ chưa có tên`,
          rssi,
          soLanQuet: 1,
          lanQuetDau: new Date(),
          lanQuetCuoi: new Date(),
          coMat: true,
        }
      }
    };
  }),

  capNhatTenTuServer: (tenMap) => set(state => {
    // Cập nhật tên cho các tag đã có
    const tagsCapNhat = { ...state.tags };
    Object.entries(tenMap).forEach(([epc, ten]) => {
      if (tagsCapNhat[epc]) {
        tagsCapNhat[epc] = { ...tagsCapNhat[epc], tenHienThi: ten };
      }
    });
    return { tags: tagsCapNhat, tenTuServer: tenMap };
  }),

  doiTen: (epc, tenMoi) => set(state => ({
    tags: { ...state.tags, [epc]: { ...state.tags[epc], tenHienThi: tenMoi } }
  })),

  batDauPhienMoi: () => set(state => {
    const tagsCapNhat = Object.fromEntries(
      Object.entries(state.tags).map(([k, v]) => [k, { ...v, coMat: false }])
    );
    return { tags: tagsCapNhat };
  }),

  xoaTatCa: () => set({ tags: {} }),

  luuVaoBo: async () => {
    await AsyncStorage.setItem('rfid_tags', JSON.stringify(get().tags));
  },

  taiTuBo: async () => {
    const raw = await AsyncStorage.getItem('rfid_tags');
    if (raw) set({ tags: JSON.parse(raw) });
  },
}));
