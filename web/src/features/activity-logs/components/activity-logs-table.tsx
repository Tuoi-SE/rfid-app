import React from 'react';
import { Pagination } from '@/components/Pagination';
import { Radio, Loader2 } from 'lucide-react'; 
import { ActivityLog } from '../types';

interface ActivityLogsTableProps {
  data: ActivityLog[];
  isLoading: boolean;
  page: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

const ActionPill = ({ action }: { action: string }) => {
  const styles: Record<string, string> = {
    CREATE: "bg-emerald-100/60 text-emerald-700",
    UPDATE: "bg-amber-100/60 text-amber-700",
    SCAN: "bg-[#04147B] text-white",
    DELETE: "bg-rose-100/60 text-rose-700",
    LOGIN: "bg-slate-800 text-white"
  };
  
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${styles[action] || "bg-slate-100 text-slate-600"}`}>
      {action}
    </span>
  );
};

export const ActivityLogsTable = ({ data, isLoading, page, totalItems, onPageChange }: ActivityLogsTableProps) => {
  const pageSize = 25;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalItems);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6 mb-6">
      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-left text-sm text-slate-600 relative">
          <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white border-b border-slate-100 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-5">Thời gian</th>
              <th className="px-6 py-5">Người thực hiện</th>
              <th className="px-6 py-5">Hành động</th>
              <th className="px-6 py-5">Thực thể</th>
              <th className="px-6 py-5 w-[35%]">Chi tiết</th>
              <th className="px-6 py-5 text-right whitespace-nowrap">Địa chỉ IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && data.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#04147B] mx-auto mb-4" />
                  <p className="text-slate-500">Đang tải dữ liệu lịch sử...</p>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                  Chưa có sự kiện nào được ghi nhận.
                </td>
              </tr>
            ) : (
              data.map((log) => {
                // Parsing time
                const logDate = new Date(log.createdAt);
                const timeString = logDate.toLocaleTimeString('vi-VN', { hour12: false });
                const dateString = logDate.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' });
                
                const isSystem = !log.user || log.user.role === 'SYSTEM' || log.user.username.includes('System');
                const username = log.user?.username || 'Hệ thống';
                const initial = username.substring(0, 2).toUpperCase();
                const avatar = `https://i.pravatar.cc/150?u=${log.userId}`;
                
                // Details serialization
                let detailsText = '';
                if (typeof log.details === 'string') {
                  detailsText = log.details;
                } else if (log.details) {
                   detailsText = JSON.stringify(log.details);
                   if (detailsText.length > 60) detailsText = detailsText.substring(0, 60) + '...';
                   // Small cleanup for nested json mapping to match design closely
                   if (log.action === 'CREATE' && log.entityId) detailsText = `Đã tạo ${log.entity?.toLowerCase() || 'bản ghi'}: ${log.entityId}`;
                   if (log.action === 'DELETE' && log.entityId) detailsText = `Đã huỷ ${log.entity?.toLowerCase() || 'bản ghi'}: ${log.entityId}`;
                   if (log.action === 'LOGIN') detailsText = `Đăng nhập hệ thống qua IP ${log.ipAddress || 'n/a'}`;
                   if (log.action === 'SCAN' && log.details?.count) detailsText = `Nhận diện ${log.details.count} tags RFID tại ${log.details.location || 'Gate'}`;
                }

                return (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-[#04147B] font-bold font-mono text-sm">{timeString}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{dateString}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {isSystem ? (
                          <div className="w-8 h-8 rounded-full bg-[#04147B] text-white flex justify-center items-center text-xs font-bold shadow-sm shrink-0">
                            SY
                          </div>
                        ) : (
                          <img 
                            src={avatar} 
                            alt={username} 
                            className="w-8 h-8 rounded-full shadow-sm object-cover border border-slate-100 shrink-0"
                          />
                        )}
                        <span className="font-bold text-slate-800">{username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <ActionPill action={log.action} />
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded text-xs tracking-wide">
                        {log.entity}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        {log.action === 'SCAN' && <Radio className="w-4 h-4 text-[#04147B] shrink-0" />}
                        <span className="text-slate-600 line-clamp-2">
                          {detailsText}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right">
                      <span className={`font-mono text-xs ${isSystem ? 'text-[#04147B] font-bold' : 'text-slate-400'}`}>
                        {log.ipAddress || (isSystem ? 'INTERNAL' : 'N/A')}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/30 border-t border-slate-100">
        <span className="text-sm font-medium text-slate-500">
          Hiển thị <span className="font-bold text-slate-700">{totalItems > 0 ? startIndex : 0} - {endIndex}</span> trong <span className="font-bold text-slate-700">{totalItems.toLocaleString('en-US')}</span> sự kiện
        </span>
        <Pagination 
          currentPage={page} 
          totalPages={totalPages} 
          totalItems={totalItems} 
          pageSize={pageSize} 
          onPageChange={onPageChange} 
          itemName="sự kiện"
        />
      </div>
    </div>
  );
};
