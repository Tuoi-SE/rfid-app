import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { X, Loader2, Package, Tag, Search, MapPin, AlertTriangle } from 'lucide-react';

interface TagEvent {
  id: string;
  type: string;
  location?: string;
  description?: string;
  createdAt: string;
}

const getEventIcon = (type: string) => {
  switch (type) {
    case 'CREATED': return <Tag className="w-5 h-5 text-slate-500" />;
    case 'ASSIGNED': return <Package className="w-5 h-5 text-indigo-500" />;
    case 'SCANNED': return <Search className="w-5 h-5 text-green-500" />;
    case 'MOVED': return <MapPin className="w-5 h-5 text-blue-500" />;
    case 'MISSING': return <AlertTriangle className="w-5 h-5 text-red-500" />;
    default: return <div className="w-3 h-3 rounded-full bg-slate-300 mx-1" />;
  }
};

const getEventColor = (type: string) => {
  switch (type) {
    case 'CREATED': return 'bg-slate-100 text-slate-800';
    case 'ASSIGNED': return 'bg-indigo-50 text-indigo-800';
    case 'SCANNED': return 'bg-green-50 text-green-800';
    case 'MOVED': return 'bg-blue-50 text-blue-800';
    case 'MISSING': return 'bg-red-50 text-red-800';
    default: return 'bg-slate-50 text-slate-800';
  }
};

const getEventTitle = (type: string) => {
  switch (type) {
    case 'CREATED': return 'Khởi tạo thẻ';
    case 'ASSIGNED': return 'Gán Sản phẩm';
    case 'SCANNED': return 'Quét kiểm kê';
    case 'UPDATED': return 'Cập nhật thông tin';
    case 'MOVED': return 'Di chuyển';
    case 'MISSING': return 'Thất lạc';
    default: return type;
  }
};

export default function TagTimelineModal({ epc, onClose }: { epc: string; onClose: () => void }) {
  const { data: events, isLoading } = useQuery({
    queryKey: ['tag_history', epc],
    queryFn: () => api.getTagHistory(epc),
  });

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Lịch sử Hành trình</h2>
            <p className="text-sm text-slate-500 mt-1 font-mono">{epc}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : events && events.length > 0 ? (
            <div className="relative border-l-2 border-slate-200 ml-4 py-2 space-y-8">
              {events.map((event: TagEvent, index: number) => (
                <div key={event.id} className="relative pl-8">
                  <div className="absolute -left-[18px] top-1 bg-white border-4 border-slate-50 rounded-full p-1">
                    {getEventIcon(event.type)}
                  </div>
                  
                  <div className={`p-4 rounded-xl border border-slate-100 shadow-sm ${getEventColor(event.type)}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-base">{getEventTitle(event.type)}</h4>
                      <span className="text-xs font-medium opacity-70">
                        {new Date(event.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1.5 text-sm mb-1 opacity-90">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="font-medium">Vị trí: {event.location}</span>
                      </div>
                    )}
                    {event.description && (
                      <p className="text-sm opacity-80 mt-1 leading-relaxed">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>Chưa có lịch sử nào cho thẻ này.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
