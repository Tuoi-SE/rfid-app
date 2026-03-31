import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { Pagination } from '@/components/Pagination';
import { PermissionAction, PermissionRow, RoleKey } from '../types';

interface PermissionsTableProps {
  rows: PermissionRow[];
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
  onSort: (key: string) => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const ACTION_STYLE: Record<PermissionAction, string> = {
  MANAGE: 'bg-[#E8EEFF] text-[#04147B] border-[#CFDBFF]',
  READ: 'bg-[#EEF2FF] text-[#2454FF] border-[#D7E3FF]',
  CREATE: 'bg-[#EAFBF1] text-[#157347] border-[#CDEEDA]',
  UPDATE: 'bg-[#FFF8E6] text-[#B07300] border-[#FFE4A8]',
  DELETE: 'bg-[#FFF1F2] text-[#C1121F] border-[#FFD4D8]',
};

const roleLabel: Record<RoleKey, string> = {
  ADMIN: 'ADMIN',
  WAREHOUSE_MANAGER: 'MANAGER',
  STAFF: 'STAFF',
};

const renderActions = (actions: PermissionAction[]) => {
  if (!actions.length) {
    return <span className="text-slate-300 font-semibold text-[12px]">—</span>;
  }

  return (
    <div className="flex flex-wrap justify-center gap-1">
      {actions.map((action) => (
        <span
          key={action}
          className={`px-2 py-0.5 rounded-md border text-[9px] font-black tracking-wider ${ACTION_STYLE[action]}`}
        >
          {action}
        </span>
      ))}
    </div>
  );
};

export const PermissionsTable = ({
  rows,
  sortConfig,
  onSort,
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: PermissionsTableProps) => {
  if (!rows.length) return null;

  const renderSortableHeader = (label: string, sortKey: string, align: 'left' | 'center' = 'left') => {
    const isActive = sortConfig?.key === sortKey;
    return (
      <th
        className="px-5 py-4 font-black text-[11px] text-slate-500 tracking-widest uppercase cursor-pointer hover:bg-slate-50 transition-colors group"
        onClick={() => onSort(sortKey)}
      >
        <div className={`flex items-center gap-1.5 ${align === 'center' ? 'justify-center' : 'justify-start'}`}>
          <span className={isActive ? 'text-[#04147B]' : ''}>{label}</span>
          {isActive ? (
            sortConfig.direction === 'asc' ? (
              <ChevronUp className="w-3.5 h-3.5 text-[#04147B]" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-[#04147B]" />
            )
          ) : (
            <ChevronsUpDown className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto bg-white rounded-[20px] border border-slate-100 shadow-sm mb-4 xl:mb-6">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-white shadow-sm border-b border-slate-100">
            <tr>
              {renderSortableHeader('MODULE', 'module')}
              {renderSortableHeader('CHỨC NĂNG', 'feature')}
              {renderSortableHeader('ROUTE', 'route')}
              {renderSortableHeader(roleLabel.ADMIN, 'admin', 'center')}
              {renderSortableHeader(roleLabel.WAREHOUSE_MANAGER, 'manager', 'center')}
              {renderSortableHeader(roleLabel.STAFF, 'staff', 'center')}
              {renderSortableHeader('GHI CHÚ', 'note')}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-4">
                  <div className="font-bold text-slate-800 text-[13px]">{row.module}</div>
                </td>
                <td className="px-5 py-4">
                  <div className="font-semibold text-slate-700 text-[13px]">{row.feature}</div>
                </td>
                <td className="px-5 py-4">
                  <code className="text-[11px] font-semibold text-[#04147B] bg-[#EEF2FF] px-2 py-1 rounded-md">
                    {row.route}
                  </code>
                </td>
                <td className="px-5 py-4 text-center">{renderActions(row.roles.ADMIN)}</td>
                <td className="px-5 py-4 text-center">{renderActions(row.roles.WAREHOUSE_MANAGER)}</td>
                <td className="px-5 py-4 text-center">{renderActions(row.roles.STAFF)}</td>
                <td className="px-5 py-4">
                  <span className="text-[12px] text-slate-500 font-medium">{row.note || '—'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={onPageChange}
        itemName="rule"
      />
    </div>
  );
};

