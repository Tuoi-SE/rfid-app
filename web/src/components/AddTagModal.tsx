'use client';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { X, Loader2 } from 'lucide-react';

interface AddTagProps {
  onClose: () => void;
}

export function AddTagModal({ onClose }: AddTagProps) {
  const queryClient = useQueryClient();
  const [epc, setEpc] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!epc) throw new Error("Mã EPC là bắt buộc");
      return api.createTag({
        epc,
        name: name || 'Tên thẻ mới',
        category: category || undefined,
        location: location || undefined
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.message || "Lỗi tạo thẻ");
    }
  });

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Cấp thẻ mới</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded bg-slate-50"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-6 space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}
          
           <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mã thẻ (EPC) <span className="text-red-500">*</span></label>
            <input 
              value={epc} onChange={e => setEpc(e.target.value)} 
              placeholder="Ex: E2 80 69 15 00 00..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm uppercase font-mono" 
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
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !epc}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Tạo thẻ
          </button>
        </div>
      </div>
    </div>
  );
}
