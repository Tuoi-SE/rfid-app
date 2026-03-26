'use client';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useReactTable, getCoreRowModel, flexRender, getPaginationRowModel, ColumnDef } from '@tanstack/react-table';
import { Loader2, Calendar, Clock, Eye } from 'lucide-react';
import { SessionDetailsModal } from '@/components/SessionDetailsModal';

interface SessionData {
  id: string;
  name: string;
  startedAt: string;
  endedAt: string | null;
  totalTags: number;
}

export default function SessionsPage() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const { data: sessionData, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.getSessions(),
  });
  
  const sessions = Array.isArray(sessionData) ? sessionData : (sessionData?.data || []);

  const columns = useMemo<ColumnDef<SessionData>[]>(() => [
    { accessorKey: 'name', header: 'Tên Phiên', cell: (info) => <span className="font-semibold text-slate-800">{String(info.getValue())}</span> },
    { accessorKey: 'startedAt', header: 'Bắt đầu', cell: (info) => <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" />{new Date(String(info.getValue())).toLocaleString('vi-VN')}</div> },
    { accessorKey: 'endedAt', header: 'Kết thúc', cell: (info) => <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" />{info.getValue() ? new Date(String(info.getValue())).toLocaleString('vi-VN') : 'Đang chạy'}</div> },
    { accessorKey: 'totalTags', header: 'Tổng Thẻ', cell: (info) => <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md font-medium">{String(info.getValue())}</span> },
    { 
      id: 'actions', 
      header: '', 
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
           <button 
             onClick={() => setSelectedSessionId(row.original.id)}
             className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium"
           >
             <Eye className="w-4 h-4" /> Chi tiết
           </button>
        </div>
      ) 
    }
  ], []);

  const table = useReactTable({
    data: sessions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Lịch sử Phiên quét</h1>
          <p className="text-slate-500 mt-1">Quản lý và tra cứu các đợt kiểm kê tài sản bằng thiết bị RFID cầm tay.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="px-6 py-4 font-semibold">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
                {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-6 py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Chưa có phiên quét nào được lưu.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
          <div>Hiển thị <span className="font-medium text-slate-800">{table.getRowModel().rows.length}</span> / {sessions.length} phiên</div>
          <div className="flex gap-2">
            <button 
              onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}
              className="px-3 py-1 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50"
            >Trước</button>
            <button 
              onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}
              className="px-3 py-1 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50"
            >Sau</button>
          </div>
        </div>
      </div>

      {selectedSessionId && (
        <SessionDetailsModal 
          sessionId={selectedSessionId} 
          onClose={() => setSelectedSessionId(null)} 
        />
      )}
    </div>
  );
}
