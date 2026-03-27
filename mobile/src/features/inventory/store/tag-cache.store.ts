import { create } from 'zustand';

interface TagCacheState {
  serverNames: Record<string, string>; // EPC -> Name
  updateServerNames: (names: Record<string, string>) => void;
  renameTag: (epc: string, newName: string) => void;
  getName: (epc: string) => string;
}

export const useTagCacheStore = create<TagCacheState>((set, get) => ({
  serverNames: {},
  updateServerNames: (names) => set(state => ({ 
    serverNames: { ...state.serverNames, ...names } 
  })),
  renameTag: (epc, newName) => set(state => ({ 
    serverNames: { ...state.serverNames, [epc]: newName } 
  })),
  getName: (epc) => get().serverNames[epc] || 'Thẻ chưa có tên',
}));
