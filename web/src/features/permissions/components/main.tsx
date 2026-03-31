'use client';

import { useMemo, useState } from 'react';
import { Loader2, RefreshCw, ShieldCheck, ShieldX, UserCog } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { TableActions } from '@/components/TableActions';
import { PermissionAction, PermissionRow } from '../types';
import { PermissionsTable } from './permissions-table';

const PAGE_SIZE = 8;

const PERMISSION_ROWS: PermissionRow[] = [
  {
    id: 'dashboard-summary',
    module: 'Dashboard',
    feature: 'Xem tổng quan hệ thống',
    route: '/dashboard/summary',
    note: 'Chỉ ADMIN được truy cập dashboard',
    roles: { ADMIN: ['READ'], WAREHOUSE_MANAGER: [], STAFF: [] },
  },
  {
    id: 'users-management',
    module: 'Người dùng',
    feature: 'Quản lý tài khoản nội bộ',
    route: '/users',
    note: 'ADMIN toàn quyền',
    roles: { ADMIN: ['MANAGE'], WAREHOUSE_MANAGER: [], STAFF: [] },
  },
  {
    id: 'categories-management',
    module: 'Danh mục',
    feature: 'CRUD danh mục',
    route: '/categories',
    note: 'MANAGER & STAFF chỉ đọc',
    roles: { ADMIN: ['MANAGE'], WAREHOUSE_MANAGER: ['READ'], STAFF: ['READ'] },
  },
  {
    id: 'products-management',
    module: 'Sản phẩm',
    feature: 'CRUD sản phẩm',
    route: '/products',
    note: 'MANAGER & STAFF chỉ đọc',
    roles: { ADMIN: ['MANAGE'], WAREHOUSE_MANAGER: ['READ'], STAFF: ['READ'] },
  },
  {
    id: 'tags-management',
    module: 'Kho thẻ RFID',
    feature: 'Quản lý thẻ',
    route: '/tags',
    note: 'MANAGER & STAFF chỉ đọc chi tiết',
    roles: { ADMIN: ['MANAGE'], WAREHOUSE_MANAGER: ['READ'], STAFF: ['READ'] },
  },
  {
    id: 'orders-flow',
    module: 'Đơn hàng',
    feature: 'Tạo và theo dõi đơn nhập/xuất',
    route: '/orders',
    note: 'MANAGER & STAFF tạo + xem; sửa/hủy theo policy',
    roles: { ADMIN: ['MANAGE'], WAREHOUSE_MANAGER: ['READ', 'CREATE'], STAFF: ['READ', 'CREATE'] },
  },
  {
    id: 'inventory-flow',
    module: 'Tồn kho',
    feature: 'Xem tồn kho và lịch sử',
    route: '/inventory',
    note: 'POST nhập/xuất chỉ ADMIN',
    roles: { ADMIN: ['READ', 'CREATE'], WAREHOUSE_MANAGER: ['READ'], STAFF: ['READ'] },
  },
  {
    id: 'locations-management',
    module: 'Địa điểm',
    feature: 'Quản lý vị trí kho/xưởng',
    route: '/locations',
    note: 'MANAGER & STAFF chỉ đọc',
    roles: { ADMIN: ['MANAGE'], WAREHOUSE_MANAGER: ['READ'], STAFF: ['READ'] },
  },
  {
    id: 'sessions-flow',
    module: 'Phiên quét',
    feature: 'Tạo phiên quét và xem chi tiết',
    route: '/sessions',
    note: 'Assign product cần quyền UPDATE',
    roles: { ADMIN: ['MANAGE'], WAREHOUSE_MANAGER: ['READ', 'CREATE'], STAFF: ['READ', 'CREATE'] },
  },
  {
    id: 'scan-flow',
    module: 'Scan',
    feature: 'Ghi nhận dữ liệu quét',
    route: '/scan',
    note: 'MANAGER toàn quyền scan; STAFF chỉ tạo + đọc',
    roles: { ADMIN: ['MANAGE'], WAREHOUSE_MANAGER: ['MANAGE'], STAFF: ['READ', 'CREATE'] },
  },
  {
    id: 'transfers-flow',
    module: 'Điều chuyển',
    feature: 'Tạo/nhận/hủy phiếu điều chuyển',
    route: '/transfers',
    note: 'Theo controller hiện tại STAFF vẫn xem được list/detail',
    roles: { ADMIN: ['READ', 'CREATE', 'UPDATE'], WAREHOUSE_MANAGER: ['READ', 'UPDATE'], STAFF: ['READ'] },
  },
  {
    id: 'activity-logs',
    module: 'Nhật ký',
    feature: 'Xem lịch sử hoạt động',
    route: '/activity-logs',
    note: 'Dùng để audit thao tác hệ thống',
    roles: { ADMIN: ['READ'], WAREHOUSE_MANAGER: ['READ'], STAFF: ['READ'] },
  },
];

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const hasWritePermission = (actions: PermissionAction[]) =>
  actions.some((action) => action !== 'READ');

const downloadCsv = (rows: PermissionRow[]) => {
  const escapeCell = (value: string) => `"${value.replace(/"/g, '""')}"`;

  const lines = [
    ['Module', 'Feature', 'Route', 'Admin', 'Warehouse Manager', 'Staff', 'Note'].map(escapeCell).join(','),
    ...rows.map((row) =>
      [
        row.module,
        row.feature,
        row.route,
        row.roles.ADMIN.join('|') || 'NONE',
        row.roles.WAREHOUSE_MANAGER.join('|') || 'NONE',
        row.roles.STAFF.join('|') || 'NONE',
        row.note || '',
      ]
        .map(escapeCell)
        .join(','),
    ),
  ];

  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'permission-matrix.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const PermissionsMain = () => {
  const [search, setSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'admin_only' | 'manager_access' | 'staff_access' | 'staff_write'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({
    key: 'module',
    direction: 'asc',
  });
  const [currentPage, setCurrentPage] = useState(1);

  const filteredRows = useMemo(() => {
    const keyword = normalizeText(search);

    return PERMISSION_ROWS.filter((row) => {
      if (scopeFilter === 'admin_only') {
        if (row.roles.WAREHOUSE_MANAGER.length > 0 || row.roles.STAFF.length > 0) return false;
      }
      if (scopeFilter === 'manager_access' && row.roles.WAREHOUSE_MANAGER.length === 0) return false;
      if (scopeFilter === 'staff_access' && row.roles.STAFF.length === 0) return false;
      if (scopeFilter === 'staff_write' && !hasWritePermission(row.roles.STAFF)) return false;

      if (!keyword) return true;

      const searchBlob = normalizeText(
        [
          row.module,
          row.feature,
          row.route,
          row.note || '',
          row.roles.ADMIN.join(' '),
          row.roles.WAREHOUSE_MANAGER.join(' '),
          row.roles.STAFF.join(' '),
        ].join(' '),
      );

      return searchBlob.includes(keyword);
    });
  }, [scopeFilter, search]);

  const sortedRows = useMemo(() => {
    if (!sortConfig) return filteredRows;

    const direction = sortConfig.direction === 'asc' ? 1 : -1;

    const getSortValue = (row: PermissionRow) => {
      switch (sortConfig.key) {
        case 'module':
          return row.module;
        case 'feature':
          return row.feature;
        case 'route':
          return row.route;
        case 'note':
          return row.note || '';
        case 'admin':
          return row.roles.ADMIN.length;
        case 'manager':
          return row.roles.WAREHOUSE_MANAGER.length;
        case 'staff':
          return row.roles.STAFF.length;
        default:
          return row.module;
      }
    };

    return [...filteredRows].sort((a, b) => {
      const valueA = getSortValue(a);
      const valueB = getSortValue(b);

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return (valueA - valueB) * direction;
      }

      return String(valueA).localeCompare(String(valueB), 'vi') * direction;
    });
  }, [filteredRows, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRows = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return sortedRows.slice(start, start + PAGE_SIZE);
  }, [safeCurrentPage, sortedRows]);

  const stats = useMemo(() => {
    const moduleCount = new Set(PERMISSION_ROWS.map((row) => row.module)).size;
    const adminOnlyCount = PERMISSION_ROWS.filter(
      (row) => row.roles.WAREHOUSE_MANAGER.length === 0 && row.roles.STAFF.length === 0,
    ).length;
    const staffWriteCount = PERMISSION_ROWS.filter((row) => hasWritePermission(row.roles.STAFF)).length;
    const managerWriteCount = PERMISSION_ROWS.filter((row) => hasWritePermission(row.roles.WAREHOUSE_MANAGER)).length;

    return { moduleCount, adminOnlyCount, staffWriteCount, managerWriteCount };
  }, []);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const handleRefresh = () => {
    setSearch('');
    setScopeFilter('all');
    setSortConfig({ key: 'module', direction: 'asc' });
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col h-full bg-[#F4F7FB] min-h-screen -m-4 p-4 md:-m-6 md:p-6 lg:-m-8 lg:p-8 relative font-sans pb-24">
      <PageHeader
        title="Quản lý phân quyền"
        description="Ma trận quyền truy cập theo vai trò cho toàn bộ hệ thống RFID."
        actions={
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 bg-[#04147B] hover:bg-[#04147B]/90 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            Đồng bộ hiển thị
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6 mt-1">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm h-[112px] flex flex-col justify-between">
          <span className="text-[11px] font-black text-slate-400 tracking-widest uppercase">TỔNG MODULE</span>
          <div className="text-[32px] font-bold text-[#04147B] leading-none">{stats.moduleCount}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm h-[112px] flex flex-col justify-between">
          <span className="text-[11px] font-black text-slate-400 tracking-widest uppercase">RULE ADMIN ONLY</span>
          <div className="flex items-center gap-2">
            <ShieldX className="w-5 h-5 text-red-500" />
            <div className="text-[28px] font-bold text-[#04147B] leading-none">{stats.adminOnlyCount}</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm h-[112px] flex flex-col justify-between">
          <span className="text-[11px] font-black text-slate-400 tracking-widest uppercase">STAFF CÓ QUYỀN GHI</span>
          <div className="flex items-center gap-2">
            <UserCog className="w-5 h-5 text-amber-500" />
            <div className="text-[28px] font-bold text-[#04147B] leading-none">{stats.staffWriteCount}</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm h-[112px] flex flex-col justify-between">
          <span className="text-[11px] font-black text-slate-400 tracking-widest uppercase">MANAGER CÓ QUYỀN GHI</span>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <div className="text-[28px] font-bold text-[#04147B] leading-none">{stats.managerWriteCount}</div>
          </div>
        </div>
      </div>

      <TableActions
        searchPlaceholder="Tìm theo module, route, action..."
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setCurrentPage(1);
        }}
        onExport={() => downloadCsv(sortedRows)}
        showFilter={false}
        statusFilterValue={scopeFilter}
        onStatusFilterChange={(value) => {
          setScopeFilter(value as 'all' | 'admin_only' | 'manager_access' | 'staff_access' | 'staff_write');
          setCurrentPage(1);
        }}
        statusFilterOptions={[
          { value: 'all', label: 'Tất cả rule' },
          { value: 'admin_only', label: 'Chỉ ADMIN' },
          { value: 'manager_access', label: 'Manager có quyền' },
          { value: 'staff_access', label: 'Staff có quyền' },
          { value: 'staff_write', label: 'Staff có quyền ghi' },
        ]}
        statusText={`Hiển thị ${sortedRows.length} rule`}
      />

      {sortedRows.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-[20px] border border-slate-100 shadow-sm mt-2">
          <Loader2 className="w-7 h-7 text-slate-300 animate-spin mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Không có rule phù hợp bộ lọc hiện tại</p>
        </div>
      ) : (
        <PermissionsTable
          rows={paginatedRows}
          sortConfig={sortConfig}
          onSort={handleSort}
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          totalItems={sortedRows.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};
