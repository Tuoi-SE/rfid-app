'use client';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { X, Loader2 } from 'lucide-react';

interface EditTagProps {
  epc: string;
  initialName: string;
  initialCategory: string;
  initialLocation: string;
  onClose: () => void;
}

export function EditTagModal({ epc, initialName, initialCategory, initialLocation, onClose }: EditTagProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(initialName || '');
  const [category, setCategory] = useState(initialCategory || '');
  const [location, setLocation] = useState(initialLocation || '');
  
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Tên hiển thị không được để trống");
      return api.updateTag(epc, {
        name: name.trim(),
        category: category.trim(),
        location: location.trim()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      onClose();
    }
  });

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Sửa thông tin thẻ</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded bg-slate-50"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mã thẻ (EPC)</label>
            <input 
              value={epc} 
              disabled
              className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg outline-none text-sm uppercase font-mono text-slate-500 cursor-not-allowed" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên hiển thị</label>
            <input 
              value={name} onChange={e => setName(e.target.value)} 
              placeholder="Ex: Áo sơ mi xanh"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Danh mục</label>
            <input 
              value={category} onChange={e => setCategory(e.target.value)} 
              placeholder="Ex: Quần áo"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Vị trí lưu kho</label>
            <input 
              value={location} onChange={e => setLocation(e.target.value)} 
              placeholder="Ex: Kệ A1"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" 
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors">Hủy bõ</button>
          <button 
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending || !name.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}
