'use client';
import { useState } from 'react';
import { ClipboardList, Loader2, ArrowRight } from 'lucide-react';
import { useActivityLogs } from '../hooks/use-activity-logs';
import { ActivityLog } from '../types';

// Helper to get nice action labels
const getActionBadgeInfo = (action: string) => {
  switch(action) {
    case 'CHECK_IN': return { color: 'bg-emerald-50 text-emerald-700', label: 'Nhập kho' };
    case 'CHECK_OUT': return { color: 'bg-red-50 text-red-700', label: 'Xuất kho' };
    case 'LIVE_SCAN': return { color: 'bg-blue-50 text-blue-700', label: 'Quét thẻ' };
    case 'LOGIN': return { color: 'bg-slate-100 text-slate-700', label: 'Đăng nhập' };
    default: return { color: 'bg-indigo-50 text-indigo-700', label: action };
  }
};

export const ActivityLogsPageClient = () => {
const [search, setSearch] = useState('');

const { data, isLoading } = useActivityLogs(search);
const rawData = (data as any)?.data ?? data;
const logs: ActivityLog[] = Array.isArray(rawData) 
  ? rawData 
  : Array.isArray(rawData?.items) 
    ? rawData.items 
    : [];

return (
<div className="max-w-6xl">
  <div className="flex items-center justify-between mb-6">
    <div>
      <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <ClipboardList className="w-6 h-6 text-slate-500" />
        Lịch sử Hoạt động
      </h1>
      <p className="text-slate-500 text-sm mt-1">Giám sát mọi thao tác trên hệ thống</p>
    </div>
  </div>

  {/* Table */}
  {isLoading ? (
    <div className="text-center py-16 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
  ) : logs.length === 0 ? (
    <div className="text-center py-16 bg-white rounded-xl border border-slate-100">
      <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <p className="text-slate-500">Chưa có hoạt động nào được ghi nhận</p>
    </div>
  ) : (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            <th className="text-left px-5 py-3 font-medium text-slate-500">Thời gian</th>
            <th className="text-left px-5 py-3 font-medium text-slate-500">Người dùng</th>
            <th className="text-left px-5 py-3 font-medium text-slate-500">Hoạt động</th>
            <th className="text-left px-5 py-3 font-medium text-slate-500">Thực thể</th>
            <th className="text-left px-5 py-3 font-medium text-slate-500">Chi tiết</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {logs.map((log) => {
            const info = getActionBadgeInfo(log.action);
            return (
              <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString('vi-VN')}
                </td>
                <td className="px-5 py-3.5 font-medium text-slate-800">
                  {log.user?.username || 'Hệ thống'}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide ${info.color}`}>
                    {info.label}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <code className="text-xs bg-slate-50 border border-slate-200 text-slate-600 px-2 py-1 rounded-md">
                    {log.entity}
                  </code>
                </td>
                <td className="px-5 py-3.5 text-slate-500">
                  <div className="max-w-xs text-xs truncate" title={JSON.stringify(log.details)}>
                    {log.details && Object.keys(log.details).length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {log.details.count && <span>Số lượng: <strong className="text-emerald-600">{log.details.count}</strong></span>}
                        {log.details.previousStatus && log.details.newStatus && (
                          <span className="flex items-center gap-1">
                            {log.details.previousStatus} <ArrowRight className="w-3 h-3" /> <strong className="text-slate-700">{log.details.newStatus}</strong>
                          </span>
                        )}
                        {(!log.details.count && !log.details.previousStatus) && JSON.stringify(log.details)}
                      </div>
                    ) : '—'}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  )}
</div>
);
};
