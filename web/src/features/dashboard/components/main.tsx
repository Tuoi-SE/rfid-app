'use client';
import { PageHeader } from '@/components/PageHeader';
import { useDashboardSummary } from '../hooks/use-dashboard-summary';
import { DashboardStatCards } from './dashboard-stat-cards';
import { DashboardRecentActivities } from './dashboard-recent-activities';
import { DashboardCharts } from './dashboard-charts';
import { DashboardWarehouseWidget } from './dashboard-warehouse-widget';

export const DashboardMain = () => {
  const { data: response, isLoading } = useDashboardSummary();

  const stats = response?.data;



  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen -m-8 p-8 relative">

      {/* Header */}
      <PageHeader
        title="Dashboard Tổng quan"
        description="Theo dõi tình trạng kho hàng và thẻ RFID thời gian thực"
      />

      {/* 4 Stat Cards */}
      <DashboardStatCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-24">
        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-8">

          {/* Dashboard Charts & Metrics */}
          <DashboardCharts stats={stats} />

        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 flex flex-col gap-8">

          {/* Hoạt động gần đây */}
          <DashboardRecentActivities />

          {/* Image Card Widget */}
          <DashboardWarehouseWidget />

        </div>
      </div>
    </div>
  );
};
