'use client';
import { useState, useMemo } from 'react';
import { useReactTable, getCoreRowModel, flexRender, getPaginationRowModel, getFilteredRowModel, getSortedRowModel, ColumnDef, SortingState } from '@tanstack/react-table';
import { Search, Loader2, Edit, Trash2, Clock, FileSpreadsheet, Zap, ChevronLeft, ChevronRight, ScanBarcode, Radio } from 'lucide-react';
import { BulkEditModal } from './bulk-edit-modal';
import { EditTagModal } from './edit-tag-modal';
import { TagTimelineModal } from './tag-timeline-modal';
import { useTags } from '../hooks/use-tags';
import { useTagMutations } from '../hooks/use-tag-mutations';
import { TagData } from '../types';
import { TagsStatCards } from './tags-stat-cards';
import { PageHeader } from '@/components/PageHeader';
import { TableActions } from '@/components/TableActions';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { BulkActionsBar } from '@/components/BulkActionsBar';
import { TagsTable } from './tags-table';
import { useAuth } from '@/providers/AuthProvider';
import { hasAdminAccess } from '@/utils/role-helpers';
import toast from 'react-hot-toast';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'IN_WORKSHOP':
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-widest bg-emerald-50 text-emerald-600">
          TRONG XƯỞNG
        </span>
      );
    case 'IN_WAREHOUSE':
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-widest bg-blue-50 text-blue-600">
          TRONG KHO
        </span>
      );
    case 'IN_TRANSIT':
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-widest bg-amber-50 text-amber-600">
          ĐANG LUÂN CHUYỂN
        </span>
      );
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-widest bg-indigo-50 text-indigo-600">
          HOÀN THÀNH / BÁN
        </span>
      );
    case 'MISSING':
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-widest bg-rose-50 text-rose-600">
          THẤT LẠC
        </span>
      );
    case 'UNASSIGNED':
    default:
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-widest bg-slate-100 text-slate-500">
          CHƯA GÁN
        </span>
      );
  }
};

const translateStatus = (status: string | undefined): string => {
  switch (status?.toUpperCase()) {
    case 'IN_WORKSHOP': return 'Trong xưởng';
    case 'IN_WAREHOUSE': return 'Trong kho';
    case 'IN_TRANSIT': return 'Đang vận/luân chuyển';
    case 'COMPLETED': return 'Hoàn thành/Xuất bán';
    case 'MISSING': return 'Thất lạc';
    case 'UNASSIGNED': return 'Chưa gán định danh';
    default: return 'Chưa gán';
  }
};

export const TagsMain = () => {
  const { user } = useAuth();
  const isAdmin = hasAdminAccess(user?.role);

  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState({});
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isAddTagOpen, setIsAddTagOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [editTagData, setEditTagData] = useState<TagData | null>(null);
  const [timelineEpc, setTimelineEpc] = useState<string | null>(null);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data: tagsResponse, isLoading } = useTags('limit=1000');
  const rawData = (tagsResponse as any)?.data ?? tagsResponse;
  const tags: TagData[] = useMemo(() => {
    return Array.isArray(rawData) ? rawData : Array.isArray(rawData?.items) ? rawData.items : [];
  }, [rawData]);

  const totalTags = tags.length;
  const inStock = tags.filter((t) => t.status === 'IN_WAREHOUSE' || t.status === 'IN_WORKSHOP').length;
  const missing = tags.filter((t) => t.status === 'MISSING').length;
  const active24h = tags.filter((t) => t.lastSeenAt && new Date(t.lastSeenAt).getTime() > Date.now() - 24 * 60 * 60 * 1000).length;

  const { deleteMutation } = useTagMutations();

  const uniqueLocations = useMemo(() => {
    const locs = tags.map(t => t.location).filter(Boolean) as string[];
    return Array.from(new Set(locs)).map(l => ({ label: l, value: l }));
  }, [tags]);

  const filteredTags = useMemo(() => {
    return tags.filter(t => {
      if (filterStatus && t.status?.toUpperCase() !== filterStatus.toUpperCase()) return false;
      if (filterLocation && t.location !== filterLocation) return false;
      return true;
    });
  }, [tags, filterStatus, filterLocation]);

  const handleExport = () => {
    // We export the filteredTags, applying the global search filter if needed.
    // However, react-table already has the final filtered, sorted data!
    // Getting data from table.getRowModel().rows gives us exactly what the user sees (search + filter applied).
    // Let's do that below.
  };

  const columns = useMemo<ColumnDef<TagData>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="w-4 h-4 rounded border-slate-300 text-[#04147B] focus:ring-[#04147B]/20 cursor-pointer"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="w-4 h-4 rounded border-slate-300 text-[#04147B] focus:ring-[#04147B]/20 cursor-pointer"
        />
      )
    },
    {
      accessorKey: 'epc',
      header: 'MÃ EPC',
      cell: (info) => <span className="font-bold text-slate-700 text-[13px]">{String(info.getValue())}</span>
    },
    {
      accessorKey: 'productName',
      header: 'SẢN PHẨM GÁN',
      cell: (info) => <span className="font-medium text-slate-600 text-[13px] max-w-xs block truncate pr-4">{String(info.row.original.product?.name || info.row.original.name || 'Không xác định')}</span>
    },
    {
      id: 'status',
      accessorFn: (row) => translateStatus(row.status),
      header: 'TRẠNG THÁI',
      cell: (info) => getStatusBadge(info.row.original.status)
    },
    {
      accessorKey: 'location',
      header: 'VỊ TRÍ KHO',
      cell: (info) => <span className="text-slate-500 text-[13px]">{String(info.getValue() || 'Không xác định')}</span>
    },
    {
      accessorKey: 'lastSeenAt',
      header: 'LẦN QUÉT CUỐI',
      cell: (info) => {
        const val = info.getValue() as string;
        if (!val) return <span className="text-[13px] text-slate-500">—</span>;

        const timestamp = new Date(val).getTime();
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        
        let text = '';
        if (seconds < 60) text = 'Vừa xong';
        else if (seconds < 3600) text = `${Math.floor(seconds / 60)} phút trước`;
        else if (seconds < 86400) text = `${Math.floor(seconds / 3600)} giờ trước`;
        else text = new Date(val).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', year: 'numeric', month: '2-digit', day: '2-digit' });

        return <span className="text-[13px] text-slate-500">{text}</span>;
      }
    },
    {
      id: 'actions',
      enableSorting: false,
      header: () => <div className="text-right">THAO TÁC</div>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1 opacity-100 transition-opacity">
          <button
            className="p-1.5 text-slate-400 hover:text-blue-600 rounded transition-colors" title="Lịch sử (Timeline)"
            onClick={() => setTimelineEpc(row.original.epc)}
          >
            <Clock className="w-4 h-4" />
          </button>
          
          {isAdmin && (
            <button
              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded transition-colors" title="Sửa"
              onClick={() => setEditTagData(row.original)}
            >
              <Edit className="w-4 h-4" />
            </button>
          )}

          {isAdmin && (
            <button
              className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors" title="Xóa"
              onClick={() => setTagToDelete(row.original.epc)}
            ><Trash2 className="w-4 h-4" /></button>
          )}
        </div>
      )
    }
  ], [deleteMutation, isAdmin]);

  const table = useReactTable({
    data: filteredTags,
    columns,
    state: { globalFilter, rowSelection, sorting },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    autoResetPageIndex: false,
    initialState: {
      pagination: { pageSize: 10 }
    }
  });

  const selectedRows = table.getSelectedRowModel().flatRows;
  const selectedEpcs = selectedRows.map(r => r.original.epc);

  const exportExcel = () => {
    const rowsToExport = table.getFilteredRowModel().rows.map(row => row.original);
    const exportData = rowsToExport.map(t => ({
      'Mã EPC': t.epc,
      'Sản Phẩm': t.product?.name || t.name || 'Không xác định',
      'Kho': t.location || 'Không xác định',
      'Category': t.product?.category?.name || t.category || 'Không xác định',
      'Trạng Thái': translateStatus(t.status),
      'Quét Cuối': t.lastSeenAt ? new Date(t.lastSeenAt).toLocaleString('vi-VN') : '',
    }));
    import('@/utils/export-excel').then(mod => {
      mod.exportToExcel(exportData, 'Danh_Sach_Tags');
    });
  };

  if (isLoading) return <div className="flex justify-center items-center h-[70vh]"><Loader2 className="w-8 h-8 animate-spin text-[#04147B]" /></div>;

  return (
    <div className="flex flex-col flex-1 h-full min-h-[700px] 2xl:min-h-0 bg-[#F4F7FB] -m-4 p-4 md:-m-5 md:p-5 lg:-m-6 lg:p-6 relative font-sans">

      {/* HEADER SECTION */}
      <PageHeader
        title="Quản lý Tags RFID"
        description="Danh sách hàng nghìn thẻ RFID trong hệ thống"
        actions={
          isAdmin ? (
            <>
              <button
                disabled={tags.length === 0}
                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-[12px] font-bold text-sm shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4 text-slate-400" />
                Nhập dữ liệu Excel
              </button>
              <button
                onClick={() => setIsAddTagOpen(true)}
                className="flex items-center gap-2 bg-[#04147B] text-white px-5 py-2.5 rounded-[12px] font-bold text-sm shadow-sm hover:bg-[#030e57] transition-all"
              >
                Thêm Tag Mới
              </button>
            </>
          ) : undefined
        }
      />

      {/* STAT CARDS AT BOTTOM */}
      <TagsStatCards totalTags={totalTags} inStock={inStock} missing={missing} active24h={active24h} />

      {/* FILTER BAR */}
      <TableActions
        searchValue={globalFilter ?? ''}
        onSearchChange={setGlobalFilter}
        searchPlaceholder="Tìm kiếm thẻ EPC, danh mục..."
        showExport={true}
        onExport={exportExcel}
        filters={[
          {
            key: 'status',
            label: 'Tất cả trạng thái',
            value: filterStatus,
            onChange: setFilterStatus,
            options: [
              { label: 'Trong xưởng', value: 'IN_WORKSHOP' },
              { label: 'Trong kho', value: 'IN_WAREHOUSE' },
              { label: 'Đang luân chuyển', value: 'IN_TRANSIT' },
              { label: 'Hoàn thành / Đã bán', value: 'COMPLETED' },
              { label: 'Thất lạc', value: 'MISSING' },
              { label: 'Chưa gán định danh', value: 'UNASSIGNED' }
            ]
          },
          {
            key: 'location',
            label: 'Tất cả vị trí kho',
            value: filterLocation,
            onChange: setFilterLocation,
            options: uniqueLocations
          }
        ]}
        statusText={`Đang hiển thị ${table.getFilteredRowModel().rows.length} thẻ RFID`}
      />

      {/* MAIN DATA TABLE */}
      <TagsTable table={table as any} totalItems={tags.length} />

      {/* MODALS */}
      {isBulkEditOpen && (
        <BulkEditModal
          selectedEpcs={selectedEpcs}
          onClose={() => {
            setIsBulkEditOpen(false);
            setRowSelection({});
          }}
        />
      )}


      {editTagData && (
        <EditTagModal
          epc={editTagData.epc}
          initialName={editTagData.product?.name || editTagData.name || ''}
          initialCategory={editTagData.product?.category?.name || editTagData.category || ''}
          initialLocation={editTagData.location || ''}
          initialLocationId={editTagData.locationId || ''}
          initialStatus={editTagData.status || 'UNASSIGNED'}
          onClose={() => setEditTagData(null)}
        />
      )}

      {timelineEpc && (
        <TagTimelineModal
          epc={timelineEpc}
          onClose={() => setTimelineEpc(null)}
        />
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmDialog 
        isOpen={!!tagToDelete}
        title="Xóa thẻ RFID"
        description={`Bạn có chắc chắn muốn xóa mã EPC ${tagToDelete}? Hành động này không thể hoàn tác.`}
        confirmText="Xác nhận Xóa"
        onConfirm={() => {
          if (tagToDelete) {
            deleteMutation.mutate(tagToDelete, {
              onSuccess: () => {
                setTagToDelete(null);
                setRowSelection({});
              }
            });
          }
        }}
        isLoading={deleteMutation.isPending}
        onClose={() => setTagToDelete(null)}
      />

      {/* BULK ACTIONS BAR */}
      <BulkActionsBar 
        selectedCount={selectedEpcs.length}
        onClearSelection={() => setRowSelection({})}
        actions={[
          {
            label: 'Cập nhật hàng loạt',
            icon: Zap,
            onClick: () => setIsBulkEditOpen(true),
            variant: 'primary'
          },
          {
            label: 'Kiểm kê kho',
            icon: Search,
            onClick: () => toast('Tính năng đối chiếu trong kho sẽ ra mắt sau.', { icon: '🚧' })
          },
          {
            label: 'Xóa hàng loạt',
            icon: Trash2,
            variant: 'danger',
            onClick: () => setIsBulkDeleteOpen(true)
          }
        ]}
      />

      {/* CONFIRM BULK DELETE MODAL */}
      <ConfirmDialog 
        isOpen={isBulkDeleteOpen}
        title="Xóa hàng loạt thẻ RFID"
        description={`Bạn có chắc muốn xóa ${selectedEpcs.length} thẻ không?`}
        confirmText="Xác nhận Xóa"
        onConfirm={() => {
          selectedEpcs.forEach(epc => deleteMutation.mutate(epc));
          setRowSelection({});
          setIsBulkDeleteOpen(false);
        }}
        onClose={() => setIsBulkDeleteOpen(false)}
      />
    </div>
  );
};
