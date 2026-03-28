'use client';
import { useState } from 'react';
import { Package, Loader2, Search, Warehouse, PackageX, Truck, AlertTriangle, Tag } from 'lucide-react';
import { useStockSummary } from '../hooks/use-inventory';

export const InventoryPageClient = () => {
const [search, setSearch] = useState('');
const [page, setPage] = useState(1);
const perPage = 10;

const { data, isLoading } = useStockSummary();

const overview = data?.overview;
const products = data?.productBreakdown ?? [];
const categories = data?.categoryBreakdown ?? [];

const filteredProducts = products.filter(
(p) =>
  p.name.toLowerCase().includes(search.toLowerCase()) ||
  p.sku.toLowerCase().includes(search.toLowerCase()) ||
  p.category.toLowerCase().includes(search.toLowerCase())
);

const totalPages = Math.max(1, Math.ceil(filteredProducts.length / perPage));
const paginatedProducts = filteredProducts.slice((page - 1) * perPage, page * perPage);

const statusCards = [
{
  label: 'Trong Kho',
  value: overview?.statuses?.IN_STOCK ?? 0,
  icon: <Warehouse className="w-5 h-5" />,
  color: 'bg-emerald-50 border-emerald-100 text-emerald-700',
  iconBg: 'bg-emerald-100',
},
{
  label: 'Đã Xuất',
  value: overview?.statuses?.OUT_OF_STOCK ?? 0,
  icon: <PackageX className="w-5 h-5" />,
  color: 'bg-slate-50 border-slate-200 text-slate-700',
  iconBg: 'bg-slate-200',
},
{
  label: 'Đang Vận Chuyển',
  value: overview?.statuses?.IN_TRANSIT ?? 0,
  icon: <Truck className="w-5 h-5" />,
  color: 'bg-sky-50 border-sky-100 text-sky-700',
  iconBg: 'bg-sky-100',
},
{
  label: 'Mất Tích',
  value: overview?.statuses?.MISSING ?? 0,
  icon: <AlertTriangle className="w-5 h-5" />,
  color: 'bg-red-50 border-red-100 text-red-700',
  iconBg: 'bg-red-100',
},
{
  label: 'Chưa Gán SP',
  value: overview?.unassignedTags ?? 0,
  icon: <Tag className="w-5 h-5" />,
  color: 'bg-amber-50 border-amber-100 text-amber-700',
  iconBg: 'bg-amber-100',
},
];

if (isLoading) {
return (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
  </div>
);
}

return (
<div className="max-w-6xl">
  <div className="mb-6">
    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
      <Package className="w-6 h-6 text-indigo-500" />
      Tổng quan Tồn kho
    </h1>
    <p className="text-slate-500 text-sm mt-1">
      Thống kê trạng thái thẻ RFID theo thời gian thực &bull; Tổng cộng{' '}
      <strong className="text-indigo-600">{overview?.totalTags ?? 0}</strong> thẻ
    </p>
  </div>

  {/* Status Cards */}
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
    {statusCards.map((card) => (
      <div
        key={card.label}
        className={`rounded-xl border p-4 ${card.color} transition-shadow hover:shadow-md`}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.iconBg}`}>
            {card.icon}
          </div>
        </div>
        <div className="text-2xl font-bold tracking-tight">{card.value}</div>
        <div className="text-xs font-medium opacity-70 mt-0.5">{card.label}</div>
      </div>
    ))}
  </div>

  {/* Category Summary */}
  {categories.length > 0 && (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-slate-800 mb-3">Phân bổ theo Danh mục</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const pct = cat.total === 0 ? 0 : Math.round((cat.inStock / cat.total) * 100);
          return (
            <div key={cat.name} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800 text-sm">{cat.name}</h3>
                <span className="text-xs font-mono text-slate-400">{cat.total} thẻ</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>
                  <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mr-1" />
                  Trong kho: {cat.inStock}
                </span>
                <span>
                  <span className="inline-block w-2 h-2 bg-slate-300 rounded-full mr-1" />
                  Đã xuất: {cat.outOfStock}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )}

  {/* Product Breakdown Table */}
  <div>
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-lg font-semibold text-slate-800">Chi tiết theo Sản phẩm</h2>
    </div>
    <div className="relative mb-4">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        type="text"
        placeholder="Tìm theo tên sản phẩm, SKU, hoặc danh mục..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all bg-white"
      />
    </div>

    {filteredProducts.length === 0 ? (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
        <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">Không tìm thấy sản phẩm nào</p>
      </div>
    ) : (
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-5 py-3 font-medium text-slate-500">Sản phẩm</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500">Danh mục</th>
              <th className="text-center px-3 py-3 font-medium text-slate-500">Tổng thẻ</th>
              <th className="text-center px-3 py-3 font-medium text-emerald-600">Trong kho</th>
              <th className="text-center px-3 py-3 font-medium text-slate-500">Đã xuất</th>
              <th className="text-center px-3 py-3 font-medium text-sky-600">Vận chuyển</th>
              <th className="text-center px-3 py-3 font-medium text-red-500">Mất tích</th>
              <th className="px-5 py-3 font-medium text-slate-500 text-left">Tỉ lệ tồn</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginatedProducts.map((p) => {
              const pct = p.total === 0 ? 0 : Math.round((p.inStock / p.total) * 100);
              return (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-slate-800">{p.name}</div>
                    <div className="text-xs text-slate-400 font-mono">{p.sku}</div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{p.category}</td>
                  <td className="px-3 py-3.5 text-center">
                    <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
                      {p.total}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    {p.inStock > 0 ? (
                      <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
                        {p.inStock}
                      </span>
                    ) : (
                      <span className="text-slate-300">0</span>
                    )}
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    {p.outOfStock > 0 ? (
                      <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-bold">
                        {p.outOfStock}
                      </span>
                    ) : (
                      <span className="text-slate-300">0</span>
                    )}
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    {p.inTransit > 0 ? (
                      <span className="bg-sky-50 text-sky-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
                        {p.inTransit}
                      </span>
                    ) : (
                      <span className="text-slate-300">0</span>
                    )}
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    {p.missing > 0 ? (
                      <span className="bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full text-xs font-bold">
                        {p.missing}
                      </span>
                    ) : (
                      <span className="text-slate-300">0</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pct >= 80 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-slate-500 w-8 text-right">{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            Hiển thị {(page - 1) * perPage + 1}–{Math.min(page * perPage, filteredProducts.length)} / {filteredProducts.length} sản phẩm
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Trước
            </button>
            <span className="px-3 py-1.5 text-sm font-medium text-slate-700">Trang {page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
</div>
);
};
