'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { X, Loader2, Calendar, Clock, Tag } from 'lucide-react';

interface SessionDetailsProps {
  sessionId: string;
  onClose: () => void;
}

export function SessionDetailsModal({ sessionId, onClose }: SessionDetailsProps) {
  const { data: session, isLoading } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => api.getSessionDetail(sessionId),
  });

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Chi tiết phiên quét</h2>
            <p className="text-sm text-slate-500 mt-1">ID: {sessionId}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : session ? (
            <div className="space-y-6">
              {/* Session Summary Card */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Tên Phiên</div>
                  <div className="font-medium text-slate-800">{session.name}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Thời gian Bắt đầu</div>
                  <div className="font-medium text-slate-800 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" /> 
                    {new Date(session.startedAt).toLocaleString('vi-VN')}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Thời gian Kết thúc</div>
                  <div className="font-medium text-slate-800 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" /> 
                    {session.endedAt ? new Date(session.endedAt).toLocaleString('vi-VN') : 'Đang quét...'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Tổng Thẻ</div>
                  <div className="font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded inline-flex items-center gap-1">
                    <Tag className="w-4 h-4" /> {session.scans?.length || 0}
                  </div>
                </div>
              </div>

              {/* Scanned Tags Table */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-3 block">Danh sách thẻ đã quét ({session.scans?.length || 0})</h3>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="px-6 py-3 font-semibold">Mã EPC</th>
                          <th className="px-6 py-3 font-semibold">Tên thẻ</th>
                          <th className="px-6 py-3 font-semibold">Danh mục</th>
                          <th className="px-6 py-3 font-semibold">Vị trí</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {session.scans && session.scans.length > 0 ? (
                          session.scans.map((scan: any, i: number) => {
                            const t = scan.tag || {};
                            return (
                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-3 font-mono text-xs"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded">{scan.tagEpc}</span></td>
                              <td className="px-6 py-3 font-medium text-slate-800">{t.product?.name || t.name || '-'}</td>
                              <td className="px-6 py-3">{t.product?.category?.name || t.category || '-'}</td>
                              <td className="px-6 py-3">{t.location || '-'}</td>
                            </tr>
                            )
                          })
                        ) : (
                          <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Chưa quét được thẻ nào.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-red-500 py-10">Không tải được dữ liệu phiên quét.</div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end bg-white">
          <button onClick={onClose} className="px-5 py-2 text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
