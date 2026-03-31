import { flexRender, Table } from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { TagData } from '../types';
import { Pagination } from '@/components/Pagination';

interface TagsTableProps {
  table: Table<TagData>;
  totalItems: number;
}

export const TagsTable = ({ table, totalItems }: TagsTableProps) => {
  if (totalItems === 0 && table.getRowModel().rows.length === 0) {
    return (
      <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden mb-6">
        <div className="px-6 py-12 text-center text-slate-400 font-medium">
          Không tìm thấy thẻ RFID nào.
        </div>
      </div>
    );
  }

  const currentPage = table.getState().pagination.pageIndex + 1;
  const pageSize = table.getState().pagination.pageSize;
  const totalPages = table.getPageCount();

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto bg-white rounded-[20px] shadow-sm border border-slate-100 mb-4 xl:mb-6">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-white border-b border-slate-100 shadow-sm">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th 
                      key={header.id} 
                      className={`px-5 py-4 font-black text-[11px] text-slate-500 tracking-widest uppercase align-middle bg-white group hover:bg-slate-50 transition-colors ${header.column.getCanSort() ? 'cursor-pointer select-none' : ''}`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className={`flex items-center gap-1.5 ${header.id === 'actions' ? 'justify-end' : ''}`}>
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
            <tbody className="divide-y divide-slate-50">
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className={`hover:bg-slate-50/50 transition-colors group ${row.getIsSelected() ? 'bg-[#04147B]/5' : ''}`}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-5 py-4 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                </tr>
              )}
            </tbody>
        </table>
      </div>

      {table.getRowModel().rows.length > 0 && (
        <Pagination 
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={totalItems}
          totalPages={totalPages}
          onPageChange={(page) => table.setPageIndex(page - 1)}
          itemName="tags"
        />
      )}
    </div>
  );
};
