'use client';

import React, { useState } from 'react';
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
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Check,
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
import { CreateTransferModal } from '@/features/transfers/components/create-transfer-modal';
import { useDeleteSessionMutation } from '../api/delete-session';
import { useBulkDeleteSessionsMutation } from '../api/bulk-delete-sessions';
import { useAuth } from '@/providers/AuthProvider';
import { hasAdminAccess, isSuperAdmin } from '@/utils/role-helpers';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface SessionTableProps {
  data: SessionData[];
  isLoading?: boolean;
  onViewDetails?: (sessionId: string) => void;
}

export const SessionTable = ({ data, isLoading, onViewDetails }: SessionTableProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = hasAdminAccess(user?.role);
  const superAdmin = isSuperAdmin(user?.role);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [assigningSession, setAssigningSession] = useState<SessionData | null>(null);
  const [transferringSession, setTransferringSession] = useState<SessionData | null>(null);
  const [bulkTransferSessions, setBulkTransferSessions] = useState<SessionData[] | null>(null);

  // Thêm state cho Deletion
  const [deletingSession, setDeletingSession] = useState<SessionData | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const deleteSessionMutation = useDeleteSessionMutation();
  const bulkDeleteSessionsMutation = useBulkDeleteSessionsMutation();

  const handleTransferSuccess = async () => {
    setTransferringSession(null);
    setBulkTransferSessions(null);
    setRowSelection({});
    await queryClient.invalidateQueries({ queryKey: ['sessions'] });
  };

  const isSessionTransferred = (session: SessionData) => session.hasTransferredTags === true;

  const columns: ColumnDef<SessionData>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          aria-label="Select all"
          className="w-4 h-4 rounded border-slate-200 text-[#04147B] focus:ring-[#04147B]/20 cursor-pointer"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          aria-label="Select row"
          className="w-4 h-4 rounded border-slate-200 text-[#04147B] focus:ring-[#04147B]/20 cursor-pointer"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1.5 hover:text-slate-700 transition-colors uppercase text-[11px] font-black tracking-widest text-slate-500 group"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          TÊN PHIÊN
          {column.getIsSorted() === 'asc' ? (
            <ChevronUp className="w-3.5 h-3.5 text-[#04147B]" />
          ) : column.getIsSorted() === 'desc' ? (
            <ChevronDown className="w-3.5 h-3.5 text-[#04147B]" />
          ) : (
            <ChevronsUpDown className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </button>
      ),
      cell: ({ row }) => (
        <div className="font-bold text-slate-900 tracking-tight">
          {row.original.name}
        </div>
      ),
    },
    {
      accessorFn: (row) => (row.endedAt ? 1 : 0),
      id: 'status',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1.5 hover:text-slate-700 transition-colors uppercase text-[11px] font-black tracking-widest text-slate-500 group"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          TRẠNG THÁI
          {column.getIsSorted() === 'asc' ? (
            <ChevronUp className="w-3.5 h-3.5 text-[#04147B]" />
          ) : column.getIsSorted() === 'desc' ? (
            <ChevronDown className="w-3.5 h-3.5 text-[#04147B]" />
          ) : (
            <ChevronsUpDown className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </button>
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
      id: 'user',
      accessorFn: (row) => row.user?.username || '',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1.5 hover:text-slate-700 transition-colors uppercase text-[11px] font-black tracking-widest text-slate-500 group"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          NGƯỜI QUÉT
          {column.getIsSorted() === 'asc' ? (
            <ChevronUp className="w-3.5 h-3.5 text-[#04147B]" />
          ) : column.getIsSorted() === 'desc' ? (
            <ChevronDown className="w-3.5 h-3.5 text-[#04147B]" />
          ) : (
            <ChevronsUpDown className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </button>
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
          className="flex items-center gap-1.5 hover:text-slate-700 transition-colors uppercase text-[11px] font-black tracking-widest text-slate-500 group"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          SỐ LƯỢNG THẺ
          {column.getIsSorted() === 'asc' ? (
            <ChevronUp className="w-3.5 h-3.5 text-[#04147B]" />
          ) : column.getIsSorted() === 'desc' ? (
            <ChevronDown className="w-3.5 h-3.5 text-[#04147B]" />
          ) : (
            <ChevronsUpDown className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </button>
      ),
      cell: ({ row }) => (
        <div className="font-bold text-[#04147B]">
          {row.original.totalTags.toLocaleString()}
        </div>
      ),
    },
    {
      accessorFn: (row) => new Date(row.endedAt || row.startedAt).getTime(),
      id: 'timeRange',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1.5 hover:text-slate-700 transition-colors uppercase text-[11px] font-black tracking-widest text-slate-500 group"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          THỜI GIAN
          {column.getIsSorted() === 'asc' ? (
            <ChevronUp className="w-3.5 h-3.5 text-[#04147B]" />
          ) : column.getIsSorted() === 'desc' ? (
            <ChevronDown className="w-3.5 h-3.5 text-[#04147B]" />
          ) : (
            <ChevronsUpDown className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </button>
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
      accessorFn: (row) => {
        const hasUnassigned = row.hasUnassignedTags !== false;
        const hasAssigned = row.hasAssignedTags === true;
        const isFullyUnassigned = hasUnassigned && !hasAssigned;
        const isTransferred = isSessionTransferred(row);
        if (isTransferred) return 3;
        if (isFullyUnassigned) return 1;
        if (hasUnassigned && hasAssigned) return 1.5;
        return 2;
      },
      id: 'workflow',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1.5 hover:text-slate-700 transition-colors uppercase text-[11px] font-black tracking-widest text-slate-500 group"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          TIẾN ĐỘ CHUỖI CUNG ỨNG
          {column.getIsSorted() === 'asc' ? (
            <ChevronUp className="w-3.5 h-3.5 text-[#04147B]" />
          ) : column.getIsSorted() === 'desc' ? (
            <ChevronDown className="w-3.5 h-3.5 text-[#04147B]" />
          ) : (
            <ChevronsUpDown className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </button>
      ),
      cell: ({ row }) => {
        const hasUnassigned = row.original.hasUnassignedTags !== false;
        const hasAssigned = row.original.hasAssignedTags === true;
        const isFullyUnassigned = hasUnassigned && !hasAssigned;
        const isMixed = hasUnassigned && hasAssigned;
        const isTransferred = isSessionTransferred(row.original);
        
        if (isTransferred) {
           return (
             <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-emerald-50 text-emerald-700 font-bold text-xs ring-1 ring-inset ring-emerald-500/20 shadow-[0_1px_3px_rgb(16,185,129,0.1)]">
               <Check className="w-3.5 h-3.5" />
               3. Đã điều chuyển
             </div>
           );
        } else if (isMixed) {
           return (
             <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-amber-50 text-amber-700 font-bold text-xs ring-1 ring-inset ring-amber-500/20">
               <PackagePlus className="w-3.5 h-3.5" />
               1.5 Gán SP dở dang
             </div>
           );
        } else if (isFullyUnassigned) {
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
      accessorFn: (row) => row.order?.code || '',
      id: 'orderRef',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1.5 hover:text-slate-700 transition-colors uppercase text-[11px] font-black tracking-widest text-slate-500 group"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          ĐƠN HÀNG
          {column.getIsSorted() === 'asc' ? (
            <ChevronUp className="w-3.5 h-3.5 text-[#04147B]" />
          ) : column.getIsSorted() === 'desc' ? (
            <ChevronDown className="w-3.5 h-3.5 text-[#04147B]" />
          ) : (
            <ChevronsUpDown className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </button>
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
      header: () => (
        <div className="uppercase text-[11px] font-black tracking-widest text-slate-500 text-right">
          THAO TÁC
        </div>
      ),
      cell: ({ row }) => {
        const hasUnassigned = row.original.hasUnassignedTags !== false;
        const hasAssigned = row.original.hasAssignedTags === true;
        const isFullyUnassigned = hasUnassigned && !hasAssigned;
        const isTransferred = isSessionTransferred(row.original);
        const canAssign = isAdmin || hasUnassigned;
        const canTransfer = !isFullyUnassigned;

        if (isTransferred && !superAdmin) {
          return (
            <div className="flex items-center gap-1 justify-end min-w-[100px] opacity-50 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => onViewDetails?.(row.original.id)}
                className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                title="Xem Chi Tiết Dữ liệu Phiên"
              >
                <FileText className="w-5 h-5" />
              </button>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-1 justify-end min-w-[100px] opacity-50 group-hover:opacity-100 transition-opacity">
            {canAssign ? (
              <button 
                onClick={() => setAssigningSession(row.original)}
                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title={isAdmin ? "ADMIN: Gán hoặc gán lại sản phẩm cho toàn bộ thẻ trong phiên" : "Bước 1: Gán SP Hàng Loạt"}
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

            {canTransfer ? (
               <button 
                 onClick={() => setTransferringSession(row.original)}
                 className="p-2 text-slate-400 hover:text-[#04147B] hover:bg-indigo-50 rounded-lg transition-colors"
                 title="Bước 2: Giao xuống Xưởng"
               >
                 <Truck className="w-5 h-5" />
               </button>
            ) : (
              <div 
                className="p-2 text-slate-200 cursor-not-allowed rounded-[10px]"
                title="Phiên chưa có thẻ nào được gán sản phẩm"
              >
                <Truck className="w-5 h-5 opacity-40" />
              </div>
            )}

            <div className="w-px h-6 bg-slate-200 mx-1" />

            <button 
              onClick={() => onViewDetails?.(row.original.id)}
              className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="Xem Chi Tiết Dữ liệu Phiên"
            >
              <FileText className="w-5 h-5" />
            </button>

            {superAdmin && (
              <button 
                onClick={() => setDeletingSession(row.original)}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Xóa phiên quét này"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
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
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto bg-white rounded-[20px] border border-slate-100 shadow-sm mb-4 xl:mb-6">
          <table className="w-full text-sm min-w-[1100px]">
            <thead className="sticky top-0 z-10 bg-white shadow-sm border-b border-slate-100">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`px-5 py-4 text-left whitespace-nowrap ${header.column.id === 'select' ? 'w-12 text-center' : ''}`}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-50">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr 
                  key={row.id} 
                  className={`group hover:bg-slate-50/50 transition-colors ${row.getIsSelected() ? 'bg-[#04147B]/5' : ''}`}
                >
                  {row.getVisibleCells().map((cell) => (
                     <td
                      key={cell.id}
                      className={`px-5 py-4 whitespace-nowrap align-middle ${cell.column.id === 'select' ? 'text-center' : ''}`}
                    >
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
      <div>
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
            label: 'Gộp phiên điều chuyển',
            icon: Truck,
            onClick: () => {
              const selectedSessions = table.getSelectedRowModel().rows.map((row) => row.original);
              const transferableSessions = selectedSessions.filter((session) => {
                const hasUnassigned = session.hasUnassignedTags !== false;
                const hasAssigned = session.hasAssignedTags === true;
                const isFullyUnassigned = hasUnassigned && !hasAssigned;
                const isTransferred = isSessionTransferred(session);
                return !isFullyUnassigned && (!isTransferred || superAdmin);
              });

              if (transferableSessions.length === 0) {
                toast.error('Không có phiên nào đủ điều kiện để điều chuyển. Phiên phải gán sản phẩm xong và chưa điều chuyển.');
                return;
              }

              if (transferableSessions.length < selectedSessions.length) {
                const skippedCount = selectedSessions.length - transferableSessions.length;
                toast.error(`Có ${skippedCount} phiên bị bỏ qua vì chưa đủ điều kiện điều chuyển.`);
              }

              setBulkTransferSessions(transferableSessions);
            },
          },
          {
            label: 'Xuất dữ liệu',
            icon: Download,
            onClick: () => toast(`Tính năng xuất dữ liệu cho ${table.getSelectedRowModel().rows.length} phiên đang được phát triển...`, { icon: '🚧' })
          },
          {
            label: 'Xoá phiên quét',
            icon: Trash2,
            variant: 'danger',
            onClick: () => {
              if (superAdmin) {
                setIsBulkDeleting(true);
              } else {
                toast.error('Chỉ Siêu Quản trị viên mới có quyền xoá phiên quét hàng loạt.');
              }
            }
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
          sessions={[transferringSession]}
          onClose={() => setTransferringSession(null)}
          onSuccess={handleTransferSuccess}
        />
      )}

      {bulkTransferSessions && (
        <CreateTransferModal
          sessions={bulkTransferSessions}
          onClose={() => setBulkTransferSessions(null)}
          onSuccess={handleTransferSuccess}
        />
      )}

      {deletingSession && (
        <ConfirmDialog
          isOpen={true}
          title="Xác nhận xóa phiên quét"
          description={`Bạn có chắc chắn muốn xóa phiên quét "${deletingSession.name}" không? Hành động này sẽ xóa toàn bộ dữ liệu quét bên trong phiên đó.`}
          confirmText="Xóa"
          cancelText="Hủy"
          variant="danger"
          onConfirm={() => {
            deleteSessionMutation.mutate(deletingSession.id, {
              onSuccess: () => setDeletingSession(null)
            });
          }}
          onClose={() => setDeletingSession(null)}
          isLoading={deleteSessionMutation.isPending}
        />
      )}

      {isBulkDeleting && (
        <ConfirmDialog
          isOpen={true}
          title="Xác nhận xóa hàng loạt"
          description={`Bạn có chắc chắn muốn xóa ${table.getSelectedRowModel().rows.length} phiên quét đã chọn không?`}
          confirmText="Xóa hàng loạt"
          cancelText="Hủy"
          variant="danger"
          onConfirm={() => {
            const selectedIds = table.getSelectedRowModel().rows.map(r => r.original.id);
            bulkDeleteSessionsMutation.mutate(selectedIds, {
              onSuccess: () => {
                setIsBulkDeleting(false);
                table.resetRowSelection();
              }
            });
          }}
          onClose={() => setIsBulkDeleting(false)}
          isLoading={bulkDeleteSessionsMutation.isPending}
        />
      )}
    </>
  );
};
