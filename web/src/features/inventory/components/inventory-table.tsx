import React, { useState } from 'react';
import { Box, ChevronUp, ChevronDown, ChevronsUpDown, FileSpreadsheet, Printer } from 'lucide-react';
import { 
  useReactTable, 
  getCoreRowModel, 
  getSortedRowModel, 
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  SortingState
} from '@tanstack/react-table';
import { Pagination } from '@/components/Pagination';
import { BulkActionsBar } from '@/components/BulkActionsBar';
import toast from 'react-hot-toast';

export interface InventoryProductStat {
  id: string;
  name: string;
  sku: string;
  imageUrl?: string;
  category: string;
  total: number;
  inStock: number;
  exported: number;
  inTransit: number;
  missing: number;
  stockRate: number; // 0-100
}

interface InventoryTableProps {
  data: InventoryProductStat[];
}

export const InventoryTable = ({ data }: InventoryTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const columns: ColumnDef<InventoryProductStat>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <div className="flex items-center justify-center px-2">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-slate-300 text-[#04147B] focus:ring-[#04147B] cursor-pointer"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center px-2" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-slate-300 text-[#04147B] focus:ring-[#04147B] cursor-pointer"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'name',
      header: 'Sản phẩm / SKU',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/60 overflow-hidden flex items-center justify-center flex-shrink-0">
              {item.imageUrl ? (
                <img 
                  src={item.imageUrl} 
                  alt={item.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOTRhM2I4IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTIxIDE1djRDMjEgMTkuNTUgMjAuNTUgMjAgMjAgMjBIMEMzLjQ1IDIwIDMgMTkuNTUgMyAxNVY1QzMgNC40NSAzLjQ1IDQgNCA0SDE4TDIxIDE1WiIvPjxwYXRoIGQ9Ik0zIDE1SDIxIi8+PHBhdGggZD0iTTIxIDE1TTE4IDRWMThIIj48L3N2Zz4=';
                  }}
                />
              ) : (
                <Box className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div>
              <p className="font-bold text-slate-800 mb-0.5 leading-tight">{item.name}</p>
              <p className="text-[12px] text-slate-400 font-medium uppercase tracking-wider">
                SKU: {item.sku}
              </p>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'category',
      header: 'Danh mục',
      cell: ({ getValue }) => <span className="text-slate-600 font-medium whitespace-nowrap">{getValue() as string}</span>,
    },
    {
      accessorKey: 'total',
      header: 'Tổng thẻ',
      cell: ({ getValue }) => (
        <div className="text-center font-bold text-slate-800 whitespace-nowrap">
          {(getValue() as number).toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: 'inStock',
      header: () => <div className="text-[#04147B]">Trong kho</div>,
      cell: ({ getValue }) => (
        <div className="text-center font-bold text-[#04147B] whitespace-nowrap">
          {(getValue() as number).toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: 'exported',
      header: 'Đã xuất',
      cell: ({ getValue }) => {
        const val = getValue() as number;
        return <div className="text-center font-semibold text-slate-400 whitespace-nowrap">{val > 0 ? val.toLocaleString() : '-'}</div>;
      },
    },
    {
      accessorKey: 'inTransit',
      header: 'Vận chuyển',
      cell: ({ getValue }) => {
        const val = getValue() as number;
        return <div className="text-center font-semibold text-indigo-400 whitespace-nowrap">{val > 0 ? val.toLocaleString() : '-'}</div>;
      },
    },
    {
      accessorKey: 'missing',
      header: () => <div className="text-red-500">Mất tích</div>,
      cell: ({ getValue }) => {
        const val = getValue() as number;
        return <div className="text-center font-bold text-red-500 whitespace-nowrap">{val > 0 ? val.toLocaleString() : '-'}</div>;
      },
    },
    {
      accessorKey: 'stockRate',
      header: 'Tỷ lệ tồn',
      cell: ({ row }) => {
        const rate = row.original.stockRate;
        return (
          <div className="flex items-center gap-3 w-32">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  rate < 20 ? 'bg-red-500' :
                  rate < 60 ? 'bg-amber-400' : 
                  'bg-emerald-500'
                }`}
                style={{ width: `${rate}%` }}
              />
            </div>
            <span className="text-[12px] font-bold text-slate-600 w-8 text-right">
              {rate}%
            </span>
          </div>
        );
      }
    }
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection,
      pagination,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const currentPage = table.getState().pagination.pageIndex + 1;
  const pageSize = table.getState().pagination.pageSize;
  const totalPages = table.getPageCount();
  const totalItems = data.length;
  
  const selectedCount = table.getSelectedRowModel().flatRows.length;

  return (
    <div className="flex flex-col">
      <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden mb-4 xl:mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th 
                    key={header.id} 
                    className={`px-5 py-4 font-black text-[11px] text-slate-500 tracking-widest uppercase align-middle bg-slate-50/50 group hover:bg-slate-100/50 transition-colors ${header.column.getCanSort() ? 'cursor-pointer select-none' : ''}`}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1.5">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className="text-slate-400">
                          {{
                            asc: <ChevronUp className="w-3 h-3" />,
                            desc: <ChevronDown className="w-3 h-3" />,
                          }[header.column.getIsSorted() as string] ?? <ChevronsUpDown className="w-3 h-3 opacity-30" />}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-50 text-[14px]">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map(row => (
                <tr 
                  key={row.id} 
                  className={`hover:bg-slate-50/50 transition-colors group cursor-pointer ${row.getIsSelected() ? 'bg-[#04147B]/5' : ''}`}
                  onClick={row.getToggleSelectedHandler()}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-5 py-4 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-medium">
                  Không tìm thấy dữ liệu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

    {/* Standard Shared Pagination Component */}
    {table.getRowModel().rows.length > 0 && (
      <Pagination 
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={totalItems}
        totalPages={totalPages}
        onPageChange={(page) => table.setPageIndex(page - 1)}
        itemName="sản phẩm"
      />
    )}

    {/* Bulk Actions Bar */}
    <BulkActionsBar 
      selectedCount={selectedCount}
      onClearSelection={() => setRowSelection({})}
      actions={[
        {
          label: 'Xuất Excel',
          icon: FileSpreadsheet,
          onClick: () => toast(`Đang xuất Excel cho ${selectedCount} sản phẩm...`, { icon: '⏳' }),
          variant: 'primary'
        },
        {
          label: 'In tem lệnh',
          icon: Printer,
          onClick: () => toast(`Đang chuẩn bị in tem cho ${selectedCount} sản phẩm...`, { icon: '⏳' }),
        }
      ]}
    />
    </div>
  );
};
