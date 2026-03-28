'use client';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '@/lib/http/client';
import { io } from 'socket.io-client';
import { Search, Loader2, Save, Wifi, Activity, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ScannedTag {
  epc: string;
  rssi?: number;
  name?: string;
  category?: string;
  location?: string;
}

export default function LiveCapturePageClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [scannedTags, setScannedTags] = useState<ScannedTag[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Connect to websocket server with auth
    const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000';
    const token = localStorage.getItem('token');
    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('[WS] Connected to scan server');
      setIsConnected(true);
    });
    socket.on('disconnect', () => {
      console.log('[WS] Disconnected');
      setIsConnected(false);
    });
    socket.on('connect_error', (err) => {
      console.log('[WS] Connection error:', err.message);
    });

    socket.on('liveScan', (incomingScans: { epc: string, rssi: number }[]) => {
      console.log('[WS] Received liveScan:', incomingScans.length, 'tags');
      setScannedTags(prev => {
        const next = [...prev];
        let hasNew = false;
        
        incomingScans.forEach(scan => {
          const existing = next.find(t => t.epc === scan.epc);
          if (!existing) {
            next.push({ epc: scan.epc, rssi: scan.rssi });
            hasNew = true;
          } else {
            // Update RSSI for existing tag
            existing.rssi = scan.rssi;
          }
        });

        return hasNew ? next : [...prev]; // Force re-render on RSSI update
      });
    });

    // Also listen for scanDetected (from WebSocket scanStream)
    socket.on('scanDetected', (enrichedScans: any[]) => {
      console.log('[WS] Received scanDetected:', enrichedScans.length);
      setScannedTags(prev => {
        const next = [...prev];
        enrichedScans.forEach(scan => {
          if (!next.find(t => t.epc === scan.epc)) {
            next.push({ 
              epc: scan.epc, 
              rssi: scan.rssi,
              name: scan.product?.name,
              category: scan.product?.category?.name,
            });
          }
        });
        return next;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleUpdateField = (index: number, field: keyof ScannedTag, value: string) => {
    const updated = [...scannedTags];
    updated[index] = { ...updated[index], [field]: value };
    setScannedTags(updated);
  };

  const removeTag = (epc: string) => {
    setScannedTags(scannedTags.filter(t => t.epc !== epc));
  };

  const bulkSaveMutation = useMutation({
    mutationFn: async () => {
      const updates = scannedTags
        .filter(t => t.name && t.name.trim() !== '') // Chỉ lưu các thẻ đã được gán tên
        .map(t => ({
          epc: t.epc,
          name: t.name!,
          category: t.category,
          location: t.location,
        }));

      if (updates.length === 0) throw new Error("Vui lòng nhập Tên cho ít nhất 1 thẻ!");
      return httpClient('/tags/live', { method: 'POST', body: JSON.stringify({ updates }) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      alert('Lưu các thẻ thành công!');
      // Xóa các thẻ đã lưu thành công ra khỏi mành hình
      setScannedTags(prev => prev.filter(t => !t.name || t.name.trim() === ''));
    },
    onError: (error: any) => {
      alert(`Lỗi khi lưu: ${error.message}`);
    }
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Activity className="w-8 h-8 text-indigo-600" />
            Live Capture 
          </h1>
          <p className="text-slate-500 mt-1">Chờ nhận diện thẻ mới từ Máy quét và gán tên hàng loạt.</p>
        </div>
        <div className={`px-4 py-2 rounded-full border text-sm font-medium flex items-center gap-2 ${isConnected ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          <Wifi className={`w-4 h-4 ${isConnected ? 'animate-pulse' : ''}`} />
          {isConnected ? 'Đang kết nối Máy quét' : 'Mất kết nối'}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[70vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="font-semibold text-slate-700">Thẻ đang chờ ({scannedTags.length})</div>
          <div className="flex gap-3">
             <button 
                onClick={() => setScannedTags([])}
                disabled={scannedTags.length === 0}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg disabled:opacity-50 transition-colors"
             >
                Xóa danh sách
             </button>
             <button 
                onClick={() => bulkSaveMutation.mutate()}
                disabled={scannedTags.length === 0 || bulkSaveMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
             >
                {bulkSaveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Lưu vào hệ thống
             </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-0">
          {scannedTags.length > 0 ? (
            <table className="w-full text-left text-sm text-slate-600 border-collapse">
                <thead className="text-xs text-slate-500 uppercase bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-4 font-semibold w-1/4">EPC Hex</th>
                    <th className="px-6 py-4 font-semibold w-1/4">Tên hiển thị <span className="text-red-500">*</span></th>
                    <th className="px-6 py-4 font-semibold w-1/5">Danh mục</th>
                    <th className="px-6 py-4 font-semibold w-1/5">Vị trí</th>
                    <th className="px-6 py-4 font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-slate-50/30">
                  {scannedTags.map((tag, i) => (
                    <tr key={tag.epc} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3">
                        <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-1.5 rounded-md border border-slate-200">
                          {tag.epc}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <input 
                          type="text" 
                          placeholder="Nhập tên thẻ..."
                          value={tag.name || ''}
                          onChange={e => handleUpdateField(i, 'name', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-shadow"
                        />
                      </td>
                      <td className="px-6 py-3">
                        <input 
                          type="text" 
                          placeholder="Danh mục..."
                          value={tag.category || ''}
                          onChange={e => handleUpdateField(i, 'category', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-shadow"
                        />
                      </td>
                      <td className="px-6 py-3">
                        <input 
                          type="text" 
                          placeholder="Vị trí..."
                          value={tag.location || ''}
                          onChange={e => handleUpdateField(i, 'location', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-shadow"
                        />
                      </td>
                      <td className="px-6 py-3 flex justify-end">
                        <button 
                          onClick={() => removeTag(tag.epc)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
              <div className="relative">
                <Wifi className="w-16 h-16 text-slate-200 animate-pulse" />
                <Activity className="w-8 h-8 text-indigo-400 absolute bottom-0 right-0" />
              </div>
              <p className="text-lg font-medium">Đang chờ quét thẻ mới...</p>
              <p className="text-sm">Hãy dùng máy quét RFID để quét, kết quả sẽ hiện tại đây.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
