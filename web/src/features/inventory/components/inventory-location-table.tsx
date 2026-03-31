import React, { useMemo, useState } from 'react';
import {
  Building2,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Factory,
  Search,
  Warehouse,
} from 'lucide-react';
import { Pagination } from '@/components/Pagination';
import { LocationBreakdown } from '../types';

type SortKey = 'name' | 'type' | 'totalTags' | 'inStock' | 'inTransit' | 'missing';
type SortDirection = 'asc' | 'desc';

const TYPE_LABEL: Record<string, string> = {
  ADMIN: 'Kho Admin',
  WORKSHOP: 'Xưởng',
  WORKSHOP_WAREHOUSE: 'Kho xưởng',
  WAREHOUSE: 'Kho trung tâm',
};

const TYPE_OPTIONS = [
  { value: 'ALL', label: 'Tất cả loại cơ sở' },
  { value: 'WORKSHOP', label: 'Xưởng' },
  { value: 'WORKSHOP_WAREHOUSE', label: 'Kho xưởng' },
  { value: 'WAREHOUSE', label: 'Kho trung tâm' },
  { value: 'ADMIN', label: 'Kho Admin' },
];

const getTypeIcon = (type: string) => {
  if (type === 'WORKSHOP') return Factory;
  if (type === 'WORKSHOP_WAREHOUSE' || type === 'WAREHOUSE') return Warehouse;
  return Building2;
};

interface InventoryLocationTableProps {
  data: LocationBreakdown[];
}

export const InventoryLocationTable = ({ data }: InventoryLocationTableProps) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: SortDirection;
  }>({
    key: 'totalTags',
    direction: 'desc',
  });
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return data.filter((item) => {
      const passType = typeFilter === 'ALL' || item.type === typeFilter;
      if (!passType) return false;
      if (!normalized) return true;

      return (
        item.name.toLowerCase().includes(normalized) ||
        item.code.toLowerCase().includes(normalized) ||
        (TYPE_LABEL[item.type] || item.type).toLowerCase().includes(normalized) ||
        item.parent?.name?.toLowerCase().includes(normalized)
      );
    });
  }, [data, search, typeFilter]);

  const sortedData = useMemo(() => {
    const directionFactor = sortConfig.direction === 'asc' ? 1 : -1;
    return [...filteredData].sort((a, b) => {
      const key = sortConfig.key;
      const aValue = a[key];
      const bValue = b[key];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * directionFactor;
      }

      return (
        String(aValue).localeCompare(String(bValue), 'vi', { sensitivity: 'base' }) *
        directionFactor
      );
    });
  }, [filteredData, sortConfig]);

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * pageSize;
  const pagedData = sortedData.slice(start, start + pageSize);

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: 'asc' };
      return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
    });
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) {
      return <ChevronsUpDown className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortConfig.direction === 'asc'
      ? <ChevronUp className="w-3.5 h-3.5 text-[#04147B]" />
      : <ChevronDown className="w-3.5 h-3.5 text-[#04147B]" />;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-[14px] xl:text-[16px] 2xl:text-[18px] font-bold text-slate-800 tracking-tight">
          Chi Tiết Theo Cơ Sở
        </h2>
        <span className="text-[11px] font-semibold text-slate-500">
          {filteredData.length} cơ sở
        </span>
      </div>

      <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm p-4 xl:p-5">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-3 mb-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo tên cơ sở, mã cơ sở..."
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 outline-none focus:bg-white focus:border-[#04147B] focus:ring-1 focus:ring-[#04147B]"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 outline-none focus:bg-white focus:border-[#04147B] focus:ring-1 focus:ring-[#04147B]"
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-slate-50/80 border-y border-slate-100">
              <tr>
                <th className="px-4 py-3 text-left uppercase text-[11px] font-black tracking-widest text-slate-500">
                  <button onClick={() => handleSort('name')} className="group inline-flex items-center gap-1.5">
                    Cơ sở {renderSortIcon('name')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left uppercase text-[11px] font-black tracking-widest text-slate-500">
                  <button onClick={() => handleSort('type')} className="group inline-flex items-center gap-1.5">
                    Loại {renderSortIcon('type')}
                  </button>
                </th>
                <th className="px-4 py-3 text-right uppercase text-[11px] font-black tracking-widest text-slate-500">
                  <button onClick={() => handleSort('totalTags')} className="group inline-flex items-center gap-1.5">
                    Tổng tag {renderSortIcon('totalTags')}
                  </button>
                </th>
                <th className="px-4 py-3 text-right uppercase text-[11px] font-black tracking-widest text-slate-500">
                  <button onClick={() => handleSort('inStock')} className="group inline-flex items-center gap-1.5">
                    Trong kho {renderSortIcon('inStock')}
                  </button>
                </th>
                <th className="px-4 py-3 text-right uppercase text-[11px] font-black tracking-widest text-slate-500">
                  <button onClick={() => handleSort('inTransit')} className="group inline-flex items-center gap-1.5">
                    Luân chuyển {renderSortIcon('inTransit')}
                  </button>
                </th>
                <th className="px-4 py-3 text-right uppercase text-[11px] font-black tracking-widest text-slate-500">
                  <button onClick={() => handleSort('missing')} className="group inline-flex items-center gap-1.5">
                    Mất {renderSortIcon('missing')}
                  </button>
                </th>
                <th className="px-4 py-3 text-right uppercase text-[11px] font-black tracking-widest text-slate-500">
                  Chi tiết
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagedData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500 font-medium">
                    Không có dữ liệu cơ sở phù hợp.
                  </td>
                </tr>
              )}

              {pagedData.map((item) => {
                const isExpanded = expandedId === item.id;
                const TypeIcon = getTypeIcon(item.type);

                return (
                  <React.Fragment key={item.id}>
                    <tr
                      className="hover:bg-slate-50/60 cursor-pointer transition-colors"
                      onClick={() => setExpandedId((prev) => (prev === item.id ? null : item.id))}
                    >
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800">{item.name}</div>
                        <div className="text-[12px] text-slate-500 mt-0.5">
                          {item.code}
                          {item.parent?.name ? ` • Thuộc: ${item.parent.name}` : ''}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-[#04147B]">
                          <TypeIcon className="w-3.5 h-3.5" />
                          {TYPE_LABEL[item.type] || item.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-slate-800">
                        {item.totalTags.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">
                        {item.inStock.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-indigo-600">
                        {item.inTransit.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-red-500">
                        {item.missing.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-1 text-[#04147B] font-semibold text-xs">
                          {isExpanded ? 'Ẩn' : 'Xem'}
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </span>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={7} className="px-4 py-4">
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                              <div className="rounded-lg bg-white border border-slate-100 px-3 py-2">
                                <div className="text-slate-400 uppercase font-bold tracking-wide text-[10px]">Hoàn tất</div>
                                <div className="font-bold text-slate-700 mt-1">{item.completed.toLocaleString()}</div>
                              </div>
                              <div className="rounded-lg bg-white border border-slate-100 px-3 py-2">
                                <div className="text-slate-400 uppercase font-bold tracking-wide text-[10px]">Chưa gán</div>
                                <div className="font-bold text-slate-700 mt-1">{item.unassigned.toLocaleString()}</div>
                              </div>
                              <div className="rounded-lg bg-white border border-slate-100 px-3 py-2">
                                <div className="text-slate-400 uppercase font-bold tracking-wide text-[10px]">Loại sản phẩm</div>
                                <div className="font-bold text-slate-700 mt-1">{item.productKinds.toLocaleString()}</div>
                              </div>
                              <div className="rounded-lg bg-white border border-slate-100 px-3 py-2 col-span-2">
                                <div className="text-slate-400 uppercase font-bold tracking-wide text-[10px]">Tỷ lệ tồn</div>
                                <div className="font-bold text-[#04147B] mt-1">
                                  {item.totalTags > 0
                                    ? `${Math.round((item.inStock / item.totalTags) * 100)}%`
                                    : '0%'}
                                </div>
                              </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                              <div className="px-3 py-2.5 border-b border-slate-100 text-[12px] font-black uppercase tracking-widest text-slate-500">
                                Top sản phẩm theo số tag
                              </div>
                              {item.topProducts.length === 0 ? (
                                <div className="px-3 py-4 text-sm text-slate-500">
                                  Chưa có sản phẩm gắn tag tại cơ sở này.
                                </div>
                              ) : (
                                <div className="divide-y divide-slate-100">
                                  {item.topProducts.map((product) => (
                                    <div key={product.id} className="px-3 py-2.5 flex items-center justify-between gap-3 text-sm">
                                      <div className="min-w-0">
                                        <div className="font-semibold text-slate-800 truncate">{product.name}</div>
                                        <div className="text-[12px] text-slate-500 truncate">
                                          {product.sku} • {product.category}
                                        </div>
                                      </div>
                                      <div className="font-black text-[#04147B]">{product.count.toLocaleString()}</div>
                                    </div>
                                  ))}
                                  {(item.remainingProductKinds || 0) > 0 && (
                                    <div className="px-3 py-2 text-[12px] font-semibold text-slate-500">
                                      +{item.remainingProductKinds} loại sản phẩm khác
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          totalItems={sortedData.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          itemName="cơ sở"
        />
      </div>
    </div>
  );
};

