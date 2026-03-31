'use client';

import React, { useState, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import { 
  ChevronLeft, 
  ArrowUpDown,
  Check,
  MoreHorizontal,
  Download,
  Trash2,
  PackagePlus, 
  FileText,
  Truck
} from 'lucide-react';
import { SessionData } from '../types';
import { Pagination } from '@/components/Pagination';
import { AssignProductModal } from './assign-product-modal';
import { BulkActionsBar } from '@/components/BulkActionsBar';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { httpClient } from '@/lib/http/client';
import { CreateTransferModal } from '@/features/transfers/components/create-transfer-modal';

interface SessionTableProps {
  data: SessionData[];
  isLoading?: boolean;
  onViewDetails?: (sessionId: string) => void;
}

export const SessionTable = ({ data, isLoading, onViewDetails }: SessionTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [assigningSession, setAssigningSession] = useState<SessionData | null>(null);
  const [transferringSession, setTransferringSession] = useState<SessionData | null>(null);
  const [transferredSessionIds, setTransferredSessionIds] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('rfid_transferred_sessions');
      if (stored) {
        setTransferredSessionIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse transferred sessions from local storage', e);
    }
  }, []);

  const handleTransferSuccess = (sessionId: string) => {
    setTransferredSessionIds(prev => {
      const updated = [...prev, sessionId];
      try {
        localStorage.setItem('rfid_transferred_sessions', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setTransferringSession(null);
  };
  const columns: ColumnDef<SessionData>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <label className="flex items-center justify-center cursor-pointer p-2">
          <div className="relative flex items-center justify-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={table.getIsAllPageRowsSelected()}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
              aria-label="Select all"
            />
            <div className="w-5 h-5 border-2 border-slate-300 rounded-[6px] bg-white transition-all peer-checked:bg-[#04147B] peer-checked:border-[#04147B]" />
            <Check className="w-3.5 h-3.5 text-white absolute inset-0 m-auto opacity-0 scale-50 transition-all peer-checked:opacity-100 peer-checked:scale-100 pointer-events-none" strokeWidth={3} />
          </div>
        </label>
      ),
      cell: ({ row }) => (
        <label className="flex items-center justify-center cursor-pointer p-2">
          <div className="relative flex items-center justify-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={row.getIsSelected()}
              onChange={row.getToggleSelectedHandler()}
              aria-label="Select row"
            />
            <div className="w-5 h-5 border-2 border-slate-300 rounded-[6px] bg-white transition-all peer-checked:bg-[#04147B] peer-checked:border-[#04147B]" />
            <Check className="w-3.5 h-3.5 text-white absolute inset-0 m-auto opacity-0 scale-50 transition-all peer-checked:opacity-100 peer-checked:scale-100 pointer-events-none" strokeWidth={3} />
          </div>
        </label>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <button
          className="flex items-center gap-2 hover:text-slate-700 transition-colors uppercase text-[11px] font-bold tracking-widest text-slate-400"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          TÊN PHIÊN
          <ArrowUpDown className="w-3.5 h-3.5" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="font-bold text-slate-900 tracking-tight">
          {row.original.name}
        </div>
      ),
    },
    {
      id: 'status',
      header: () => (
        <div className="uppercase text-[11px] font-bold tracking-widest text-slate-400">
          TRẠNG THÁI
        </div>
      ),
      cell: ({ row }) => {
        const isCompleted = !!row.original.endedAt;
        if (isCompleted) {
          return (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs ring-1 ring-inset ring-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              HOÀN THÀNH
            </div>
          );
        }
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 font-bold text-xs ring-1 ring-inset ring-amber-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            ĐANG CHẠY
          </div>
        );
      },
    },
    {
      accessorKey: 'user',
      header: () => (
        <div className="uppercase text-[11px] font-bold tracking-widest text-slate-400">
          NGƯỜI QUÉT
        </div>
      ),
      cell: ({ row }) => {
        const user = row.original.user;
        if (!user) return <span className="text-slate-400 text-sm">Hệ thống</span>;
        
        return (
          <div className="flex items-center gap-3">
            <img 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random`} 
              alt={user.username} 
              className="w-8 h-8 rounded-full shadow-sm"
            />
            <span className="font-medium text-slate-700">{user.username}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'totalTags',
      header: ({ column }) => (
        <button
          className="flex items-center gap-2 hover:text-slate-700 transition-colors uppercase text-[11px] font-bold tracking-widest text-slate-400"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          SỐ LƯỢNG THẺ
          <ArrowUpDown className="w-3.5 h-3.5" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="font-bold text-[#04147B]">
          {row.original.totalTags.toLocaleString()}
        </div>
      ),
    },
    {
      id: 'timeRange',
      header: () => (
        <div className="uppercase text-[11px] font-bold tracking-widest text-slate-400">
          THỜI GIAN
        </div>
      ),
      cell: ({ row }) => {
        const start = new Date(row.original.startedAt);
        const end = row.original.endedAt ? new Date(row.original.endedAt) : null;
        
        const formatDate = (date: Date) => {
          const d = String(date.getDate()).padStart(2, '0');
          const m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getMonth()];
          const time = date.toTimeString().split(' ')[0];
          return `${d} ${m}, ${time}`;
        };

        return (
          <div className="flex flex-col text-xs font-medium text-slate-500">
            {end ? <span>{formatDate(end)}</span> : <span className="text-emerald-500 font-bold animate-pulse">Đang chạy...</span>}
            <span className="text-slate-400">{formatDate(start)}</span>
          </div>
        );
      },
    },
    {
      id: 'workflow',
      header: () => (
        <div className="uppercase text-[11px] font-bold tracking-widest text-slate-400">
          TIẾN ĐỘ CHUỖI CUNG ỨNG
        </div>
      ),
      cell: ({ row }) => {
        const hasUnassigned = row.original.hasUnassignedTags !== false;
        const isTransferred = transferredSessionIds.includes(row.original.id);
        
        if (isTransferred) {
           return (
             <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-emerald-50 text-emerald-700 font-bold text-xs ring-1 ring-inset ring-emerald-500/20 shadow-[0_1px_3px_rgb(16,185,129,0.1)]">
               <Check className="w-3.5 h-3.5" />
               3. Đã điều chuyển
             </div>
           );
        } else if (hasUnassigned) {
           return (
             <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-slate-100 text-slate-600 font-bold text-xs">
               <PackagePlus className="w-3.5 h-3.5" />
               1. Chờ gán SP
             </div>
           );
        } else {
           return (
             <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-indigo-50 text-[#04147B] font-bold text-xs ring-1 ring-inset ring-indigo-500/20">
               <Truck className="w-3.5 h-3.5" />
               2. Sẵn sàng luân chuyển
             </div>
           );
        }
      }
    },
    {
      id: 'orderRef',
      header: () => (
        <div className="uppercase text-[11px] font-bold tracking-widest text-slate-400">
          ĐƠN HÀNG
        </div>
      ),
      cell: ({ row }) => {
        const order = row.original.order;
        if (!order) return <span className="text-slate-300">-</span>;
        
        return (
          <div className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-600 font-bold text-xs">
            {order.code}
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const isCompleted = !!row.original.endedAt;
        const canAssign = row.original.hasUnassignedTags !== false;

        return (
          <div className="flex items-center gap-1 justify-end min-w-[100px]">
            {canAssign ? (
              <button 
                onClick={() => setAssigningSession(row.original)}
                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-[10px] transition-colors"
                title="Bước 1: Gán SP Hàng Loạt"
              >
                <PackagePlus className="w-5 h-5" />
              </button>
            ) : (
              <div 
                className="p-2 text-slate-200 cursor-not-allowed rounded-[10px]"
                title="Đã gán xong"
              >
                <PackagePlus className="w-5 h-5 opacity-40 hover:opacity-100" />
              </div>
            )}

            {!canAssign ? (
               transferredSessionIds.includes(row.original.id) ? null : (
                 <button 
                   onClick={() => setTransferringSession(row.original)}
                   className="p-2 text-slate-400 hover:text-[#04147B] hover:bg-indigo-50 rounded-[10px] transition-colors"
                   title="Bước 2: Giao xuống Xưởng"
                 >
                   <Truck className="w-5 h-5" />
                 </button>
               )
            ) : (
              <div 
                className="p-2 text-slate-200 cursor-not-allowed rounded-[10px]"
                title="Bạn phải hoàn thành gán sản phẩm trước khi giao xưởng"
              >
                <Truck className="w-5 h-5 opacity-40" />
              </div>
            )}

            <div className="w-px h-6 bg-slate-200 mx-1" />

            <button 
              onClick={() => onViewDetails?.(row.original.id)}
              className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-[10px] transition-colors"
              title="Xem Chi Tiết Dữ liệu Phiên"
            >
              <FileText className="w-5 h-5" />
            </button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: { pageSize: 8 },
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.04)] flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#04147B] rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Đang tải dữ liệu phiên quét...</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden mb-4 xl:mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-100/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-slate-100/50">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-6 py-4 text-left first:pl-6 last:pr-6 whitespace-nowrap bg-slate-50/50 first:rounded-tl-[24px] last:rounded-tr-[24px]">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr 
                  key={row.id} 
                  className={`group border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors ${row.getIsSelected() ? 'bg-indigo-50/30' : ''}`}
                >
                  {row.getVisibleCells().map((cell) => (
                     <td key={cell.id} className="px-6 py-4 whitespace-nowrap align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-slate-500">
                  Không tìm thấy phiên quét nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>

      {/* Pagination component */}
      <div className="px-6 py-4">
        <Pagination
          currentPage={table.getState().pagination.pageIndex + 1}
          totalPages={table.getPageCount()}
          totalItems={table.getFilteredRowModel().rows.length}
          pageSize={table.getState().pagination.pageSize}
          onPageChange={(page) => table.setPageIndex(page - 1)}
          itemName="phiên quét"
        />
      </div>

      <BulkActionsBar 
        selectedCount={table.getSelectedRowModel().rows.length}
        onClearSelection={() => table.resetRowSelection()}
        actions={[
          {
            label: 'Xuất dữ liệu',
            icon: Download,
            onClick: () => alert(`Tính năng xuất dữ liệu cho ${table.getSelectedRowModel().rows.length} phiên đang được phát triển...`)
          },
          {
            label: 'Xoá phiên quét',
            icon: Trash2,
            variant: 'danger',
            onClick: () => alert(`Tính năng xoá hàng loạt đang chờ cấp quyền Admin...`)
          }
        ]}
      />

      {assigningSession && (
        <AssignProductModal
          session={assigningSession}
          onClose={() => setAssigningSession(null)}
          onSuccess={() => setAssigningSession(null)}
        />
      )}

      {transferringSession && (
        <CreateTransferModal
          session={transferringSession}
          onClose={() => setTransferringSession(null)}
          onSuccess={() => handleTransferSuccess(transferringSession.id)}
        />
      )}
    </>
  );
};

