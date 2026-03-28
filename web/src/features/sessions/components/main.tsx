'use client';

import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { TableActions } from '@/components/TableActions';
import { useSessions } from '../hooks/use-sessions';
import { SessionStatCards } from './session-stat-cards';
import { SessionTable } from './session-table';
import { SessionDetailsModal } from './session-details-modal';
import { SystemHealthIndicators } from './system-health-indicators';
import { AlertCircle } from 'lucide-react';

export const SessionsMain = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const { data, isLoading, error } = useSessions(1, 100);

  const payload = (data as any)?.data || data || {};
  const sessions = Array.isArray(payload) ? payload : (payload.items || []);

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const lowerQuery = searchQuery.toLowerCase();
    return sessions.filter((s: any) => 
      s.name?.toLowerCase().includes(lowerQuery) || 
      s.user?.username?.toLowerCase().includes(lowerQuery) ||
      s.order?.code?.toLowerCase().includes(lowerQuery)
    );
  }, [sessions, searchQuery]);

  const metrics = useMemo(() => {
    let totalScanned = 0;
    let activeCount = 0;
    
    sessions.forEach((s: any) => {
      totalScanned += (s.totalTags || 0);
      if (!s.endedAt) activeCount++;
    });

    return {
      totalScanned,
      activeCount,
      accuracy: 99.98,
      trend: '+12% so với tuần trước'
    };
  }, [sessions]);

  if (error) {
    return (
      <div className="text-red-500 text-center p-8 bg-white rounded-xl shadow-sm border border-red-100">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <h2 className="font-bold text-lg mb-2">Lỗi tải dữ liệu</h2>
        <p>Không thể kết nối với hệ thống. Vui lòng thử lại sau.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-20">
      <PageHeader
        title="Lịch sử phiên quét"
        description="Khám phá và kiểm soát các luồng quét RFID lịch sử và thời gian thực."
      />

      {/* Main Stats */}
      <SessionStatCards metrics={metrics} />

      {/* Table Actions Toolbar (Global UI Style) */}
      <TableActions 
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Tìm kiếm Tên Phiên, Nhân viên, Mã Order..."
        onExport={() => alert('Đang xử lý xuất báo cáo Excel...')}
        onFilter={() => alert('Mở thanh lọc nâng cao...')}
      />

      {/* Detailed Data Table */}
      <SessionTable 
        data={filteredSessions} 
        isLoading={isLoading} 
        onViewDetails={setSelectedSessionId} 
      />

      {/* System Health */}
      <SystemHealthIndicators />

      {/* Detail Modal */}
      {selectedSessionId && (
        <SessionDetailsModal 
          sessionId={selectedSessionId} 
          onClose={() => setSelectedSessionId(null)} 
        />
      )}
    </div>
  );
};
