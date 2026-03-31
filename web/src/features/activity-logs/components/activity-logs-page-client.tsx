'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Download, RefreshCw, Plus } from 'lucide-react';
import { ActivityLogsToolbar } from './activity-logs-toolbar';
import { ActivityLogsTable } from './activity-logs-table';
import { SecurityAlertWidget } from './security-alert-widget';
import { useActivityLogs } from '../hooks/use-activity-logs';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

export const ActivityLogsPageClient = () => {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const searchParams = useSearchParams();
  const { data, isLoading } = useActivityLogs(page, 25, searchQuery);
  
  const payload = (data as any)?.data || data;
  const logs = Array.isArray(payload) ? payload : (payload?.items || []);

  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch && urlSearch !== searchQuery) {
      setSearchQuery(urlSearch);
      setPage(1);
    }
  }, [searchParams, searchQuery]);

  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs;
    const normalized = searchQuery.toLowerCase();
    return logs.filter((log: any) =>
      log.action?.toLowerCase().includes(normalized) ||
      log.entity?.toLowerCase().includes(normalized) ||
      log.user?.username?.toLowerCase().includes(normalized) ||
      log.ipAddress?.toLowerCase().includes(normalized),
    );
  }, [logs, searchQuery]);

  const totalItems = payload?.pagination?.totalItems || filteredLogs.length || 0;

  return (
    <div className="relative pb-24">
      <PageHeader 
        title="Hoạt động Hệ thống"
        description="Theo dõi thời gian thực các thay đổi trong kho hàng và thiết bị RFID."
        actions={
          <>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
              <Download className="w-4 h-4" />
              <span>Xuất CSV</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#04147B] text-white font-bold text-sm rounded-lg hover:bg-blue-900 transition-colors shadow-sm">
              <RefreshCw className="w-4 h-4" />
              <span>Làm mới</span>
            </button>
          </>
        }
      />

      <ActivityLogsToolbar
        totalEvents={totalItems}
        searchValue={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setPage(1);
        }}
      />
      
      <ActivityLogsTable 
        data={filteredLogs} 
        isLoading={isLoading} 
        page={page} 
        totalItems={totalItems} 
        onPageChange={setPage} 
      />

      <SecurityAlertWidget />

      {/* Floating Action Button (+) */}
      <button 
        className="fixed bottom-8 right-8 w-14 h-14 bg-[#04147B] rounded-full text-white shadow-xl hover:bg-blue-900 transition-all flex justify-center items-center hover:scale-105 hover:-translate-y-1 active:scale-95 z-50 focus:outline-none focus:ring-4 focus:ring-blue-100"
        title="Tạo cảnh báo tự động"
        onClick={() => toast('Tính năng Tạo cảnh báo giám sát (Alert Rule) đang được phát triển...', { icon: '🚧' })}
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};
