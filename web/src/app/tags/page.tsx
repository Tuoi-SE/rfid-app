'use client';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useReactTable, getCoreRowModel, flexRender, getPaginationRowModel, getFilteredRowModel, ColumnDef } from '@tanstack/react-table';
import { Search, Loader2, Edit, Trash2 } from 'lucide-react';
import { BulkEditModal } from '@/components/BulkEditModal';
import { AddTagModal } from '@/components/AddTagModal';
import { EditTagModal } from '@/components/EditTagModal';

interface TagData {
  epc: string;
  name: string;
  category: string;
  location: string;
}

export default function TagsPage() {
  const queryClient = useQueryClient();
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState({});
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [isAddTagOpen, setIsAddTagOpen] = useState(false);
  const [editTagData, setEditTagData] = useState<TagData | null>(null);

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: () => api.getTags(),
  });

  const deleteMutation = useMutation({
    mutationFn: (epc: string) => api.deleteTag(epc),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }),
  });

  const columns = useMemo<ColumnDef<TagData>[]>(() => [
    { 
      id: 'select', 
      header: ({ table }) => (
        <input 
          type="checkbox" 
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
      ),
      cell: ({ row }) => (
        <input 
          type="checkbox" 
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
      )
    },
    { accessorKey: 'epc', header: 'Loại thẻ (EPC)', cell: (info) => <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{String(info.getValue())}</span> },
    { accessorKey: 'name', header: 'Tên hiển thị', cell: (info) => <span className="font-medium text-slate-800">{String(info.getValue())}</span> },
    { accessorKey: 'category', header: 'Danh mục' },
    { accessorKey: 'location', header: 'Vị trí', cell: (info) => String(info.getValue() || '-') },
    { 
      id: 'actions', 
      header: '', 
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <button 
            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded transition-colors" title="Sửa"
            onClick={() => setEditTagData(row.original)}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors" title="Xóa"
            onClick={() => { if(confirm('Xóa tag này?')) deleteMutation.mutate(row.original.epc) }}
          ><Trash2 className="w-4 h-4" /></button>
        </div>
      ) 
    }
  ], []);

  const table = useReactTable({
    data: tags,
    columns,
    state: { globalFilter, rowSelection },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const selectedRows = table.getSelectedRowModel().flatRows;
  const selectedEpcs = selectedRows.map(r => r.original.epc);

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Quản lý Thẻ (Tags)</h1>
          <p className="text-slate-500 mt-1">Danh sách lưu trữ và định danh thẻ RFID trong kho.</p>
        </div>
        <div className="flex gap-3">
          <button 
            disabled={tags.length === 0}
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Export Excel
          </button>
          <button 
            onClick={() => setIsAddTagOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-indigo-700 transition-colors"
          >
            + Cấp thẻ mới
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              value={globalFilter ?? ''}
              onChange={e => setGlobalFilter(e.target.value)}
              placeholder="Tìm EPC, Tên, Danh mục..." 
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-72 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

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
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Không tìm thấy thẻ nào phù hợp.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center gap-4">
            <div>Hiển thị <span className="font-medium text-slate-800">{table.getRowModel().rows.length}</span> / {tags.length} thẻ</div>
            {selectedEpcs.length > 0 && (
              <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-md font-medium border border-indigo-100 flex items-center gap-3">
                Đã chọn {selectedEpcs.length} thẻ
                <button 
                  onClick={() => setIsBulkEditOpen(true)}
                  className="bg-indigo-600 text-white px-3 py-1 rounded transition-colors hover:bg-indigo-700 text-xs shadow-sm"
                >
                  Sửa hàng loạt
                </button>
              </div>
            )}
          </div>
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

      {isBulkEditOpen && (
        <BulkEditModal 
          selectedEpcs={selectedEpcs} 
          onClose={() => {
            setIsBulkEditOpen(false);
            setRowSelection({});
          }} 
        />
      )}

      {isAddTagOpen && (
        <AddTagModal onClose={() => setIsAddTagOpen(false)} />
      )}

      {editTagData && (
        <EditTagModal 
          epc={editTagData.epc}
          initialName={editTagData.name}
          initialCategory={editTagData.category}
          initialLocation={editTagData.location}
          onClose={() => setEditTagData(null)}
        />
      )}
    </div>
  );
}
