'use client';

import { Search, Bell, Settings, User, LogOut, ChevronDown, Menu } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { httpClient } from '@/lib/http/client';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useState, useRef, useEffect } from 'react';
import { isSuperAdmin, getRoleDisplayName } from '@/utils/role-helpers';

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  section: string;
  keywords?: string[];
  adminOnly?: boolean;
  searchText?: string;
  score?: number;
}

const STATIC_SEARCH_ITEMS: SearchResultItem[] = [
  {
    id: 'page-dashboard',
    title: 'Tổng quan Dashboard',
    subtitle: 'Theo dõi chỉ số hệ thống',
    href: '/',
    section: 'Điều hướng',
    keywords: ['dashboard', 'tong quan', 'bao cao', 'widget', 'chart'],
  },
  {
    id: 'page-sessions',
    title: 'Phiên quét',
    subtitle: 'Kiểm tra các phiên quét RFID',
    href: '/sessions',
    section: 'Điều hướng',
    keywords: ['phien', 'scan', 'lo', 'session', 'operator', 'order'],
  },
  {
    id: 'page-transfers',
    title: 'Điều chuyển Xưởng',
    subtitle: 'Điều chuyển hàng giữa các điểm',
    href: '/transfers',
    section: 'Điều hướng',
    keywords: ['transfer', 'dieu chuyen', 'xuong', 'source', 'destination'],
  },
  {
    id: 'page-orders',
    title: 'Đơn hàng / Xuất',
    subtitle: 'Quản lý đơn nhập xuất',
    href: '/orders',
    section: 'Điều hướng',
    keywords: ['don hang', 'order', 'xuat', 'nhap', 'code', 'status'],
  },
  {
    id: 'page-inventory',
    title: 'Tồn kho',
    subtitle: 'Kiểm tra trạng thái tồn kho',
    href: '/inventory',
    section: 'Điều hướng',
    keywords: ['ton kho', 'inventory', 'stock', 'category', 'product', 'missing'],
  },
  {
    id: 'page-locations',
    title: 'Vị trí / Địa điểm',
    subtitle: 'Danh sách kho, xưởng, cơ sở',
    href: '/locations',
    section: 'Điều hướng',
    keywords: ['vi tri', 'dia diem', 'location', 'warehouse', 'workshop', 'address'],
  },
  {
    id: 'page-categories',
    title: 'Danh mục',
    subtitle: 'Quản lý nhóm sản phẩm',
    href: '/categories',
    section: 'Điều hướng',
    keywords: ['category', 'danh muc', 'description'],
  },
  {
    id: 'page-products',
    title: 'Danh sách Sản phẩm',
    subtitle: 'Tra cứu thông tin sản phẩm',
    href: '/products',
    section: 'Điều hướng',
    keywords: ['san pham', 'product', 'sku', 'category', 'tag'],
  },
  {
    id: 'page-tags',
    title: 'Kho Thẻ RFID',
    subtitle: 'Tra cứu thẻ EPC',
    href: '/tags',
    section: 'Điều hướng',
    keywords: ['rfid', 'epc', 'the', 'status', 'assign'],
  },
  {
    id: 'page-users',
    title: 'Tài khoản nội bộ',
    subtitle: 'Quản trị người dùng',
    href: '/users',
    section: 'Điều hướng',
    keywords: ['users', 'tai khoan', 'nhan vien', 'role'],
    adminOnly: true,
  },
  {
    id: 'page-permissions',
    title: 'Phân quyền hệ thống',
    subtitle: 'Ma trận quyền theo vai trò',
    href: '/permissions',
    section: 'Điều hướng',
    keywords: ['permission', 'phan quyen', 'quyen', 'role matrix', 'casl'],
    adminOnly: true,
  },
  {
    id: 'page-activity-logs',
    title: 'Nhật ký hoạt động',
    subtitle: 'Theo dõi hoạt động hệ thống',
    href: '/activity-logs',
    section: 'Điều hướng',
    keywords: ['logs', 'nhat ky', 'audit', 'action', 'entity'],
    adminOnly: true,
  },
];

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const tokenizeQuery = (query: string) =>
  normalizeText(query)
    .split(/\s+/)
    .filter(Boolean);

const extractItems = (payload: any): any[] => {
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
};

const buildSearchText = (...parts: Array<string | undefined>) =>
  parts
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(' | ');

const matchesAllTerms = (query: string, values: Array<string | undefined>) => {
  const terms = tokenizeQuery(query);
  if (terms.length === 0) return true;
  const normalizedBlob = normalizeText(values.filter(Boolean).join(' '));
  return terms.every((term) => normalizedBlob.includes(term));
};

const buildNormalizedIndexMap = (text: string) => {
  let normalized = '';
  const indexMap: number[] = [];

  for (let i = 0; i < text.length; i += 1) {
    const normalizedChar = text[i].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    for (let j = 0; j < normalizedChar.length; j += 1) {
      normalized += normalizedChar[j];
      indexMap.push(i);
    }
  }

  return { normalized, indexMap };
};

const mergeRanges = (ranges: Array<[number, number]>) => {
  if (!ranges.length) return ranges;
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [sorted[0]];

  for (let i = 1; i < sorted.length; i += 1) {
    const [start, end] = sorted[i];
    const last = merged[merged.length - 1];

    if (start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }

  return merged;
};

const findHighlightRanges = (text: string, query: string): Array<[number, number]> => {
  const terms = tokenizeQuery(query);
  if (!text || terms.length === 0) return [];

  const { normalized, indexMap } = buildNormalizedIndexMap(text);
  const ranges: Array<[number, number]> = [];

  for (const term of terms) {
    let from = 0;
    while (from < normalized.length) {
      const found = normalized.indexOf(term, from);
      if (found === -1) break;

      const startOriginal = indexMap[found];
      const endOriginal = indexMap[Math.min(found + term.length - 1, indexMap.length - 1)] + 1;
      if (Number.isInteger(startOriginal) && Number.isInteger(endOriginal)) {
        ranges.push([startOriginal, endOriginal]);
      }

      from = found + term.length;
    }
  }

  return mergeRanges(ranges);
};

const renderHighlightedText = (text: string, query: string): ReactNode => {
  const ranges = findHighlightRanges(text, query);
  if (!ranges.length) return text;

  const nodes: ReactNode[] = [];
  let cursor = 0;

  ranges.forEach(([start, end], index) => {
    if (cursor < start) {
      nodes.push(<span key={`normal-${index}`}>{text.slice(cursor, start)}</span>);
    }
    nodes.push(
      <mark key={`mark-${index}`} className="px-0.5 rounded-sm bg-amber-100 text-amber-900">
        {text.slice(start, end)}
      </mark>,
    );
    cursor = end;
  });

  if (cursor < text.length) {
    nodes.push(<span key="normal-tail">{text.slice(cursor)}</span>);
  }

  return nodes;
};

const scoreSearchResult = (query: string, item: SearchResultItem) => {
  const terms = tokenizeQuery(query);
  if (!terms.length) return 0;

  const normalizedTitle = normalizeText(item.title);
  const normalizedSubtitle = normalizeText(item.subtitle);
  const normalizedSection = normalizeText(item.section);
  const normalizedSearchText = normalizeText(item.searchText || '');

  let score = 0;

  for (const term of terms) {
    if (normalizedTitle.startsWith(term)) score += 35;
    else if (normalizedTitle.includes(term)) score += 22;

    if (normalizedSubtitle.includes(term)) score += 10;
    if (normalizedSection.includes(term)) score += 6;
    if (normalizedSearchText.includes(term)) score += 4;
  }

  if (terms.length > 1 && normalizedTitle.includes(terms.join(' '))) {
    score += 15;
  }

  return score;
};

export const Header = ({ onMenuClick }: { onMenuClick?: () => void }) => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format avatar initials (e.g., quanghiep -> QH)
  const getInitials = (name?: string) => {
    if (!name) return 'AU';
    return name.substring(0, 2).toUpperCase();
  };

  const roleText = getRoleDisplayName(user?.role);

  // Dynamic breadcrumb labels based on routes
  const getPageName = (path: string) => {
    if (path === '/') return 'Tổng quan';
    if (path.startsWith('/categories')) return 'Danh mục';
    if (path.startsWith('/products')) return 'Sản phẩm';
    if (path.startsWith('/tags')) return 'Thẻ RFID';
    if (path.startsWith('/orders')) return 'Đơn hàng';
    if (path.startsWith('/inventory')) return 'Tồn kho';
    if (path.startsWith('/sessions')) return 'Phiên quét';
    if (path.startsWith('/users')) return 'Người dùng';
    if (path.startsWith('/permissions')) return 'Phân quyền';
    if (path.startsWith('/activity-logs')) return 'Nhật ký hệ thống';
    if (path.startsWith('/locations')) return 'Địa điểm';
    if (path.startsWith('/transfers')) return 'Điều chuyển';
    return 'Quản trị';
  };

  const getStaticResults = (query: string): SearchResultItem[] => {
    const scopedItems = STATIC_SEARCH_ITEMS
      .filter((item) => !item.adminOnly || isSuperAdmin(user?.role))
      .map((item) => ({
        ...item,
        searchText: buildSearchText(item.title, item.subtitle, item.section, ...(item.keywords || [])),
      }));

    if (!query.trim()) return scopedItems.slice(0, 8);

    return scopedItems
      .filter((item) => matchesAllTerms(query, [item.searchText]))
      .slice(0, 8);
  };

  useEffect(() => {
    let isCancelled = false;

    const searchAll = async () => {
      const trimmed = searchKeyword.trim();
      if (!trimmed) {
        setSearchResults(getStaticResults(''));
        setIsSearching(false);
        return;
      }

      if (trimmed.length < 2) {
        setSearchResults(getStaticResults(trimmed));
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      const safeKeyword = encodeURIComponent(trimmed);
      const staticResults = getStaticResults(trimmed);

      const fetchAndMap = async (
        endpoint: string,
        mapper: (item: any) => SearchResultItem | null,
      ): Promise<SearchResultItem[]> => {
        try {
          const response = await httpClient(endpoint);
          return extractItems(response)
            .map(mapper)
            .filter((item): item is SearchResultItem => item !== null);
        } catch {
          return [];
        }
      };

      const fetchStockSearchItems = async (): Promise<SearchResultItem[]> => {
        try {
          const response: any = await httpClient('/inventory/stock-summary');
          const payload = response?.data || response;
          const productBreakdown = Array.isArray(payload?.productBreakdown) ? payload.productBreakdown : [];
          const categoryBreakdown = Array.isArray(payload?.categoryBreakdown) ? payload.categoryBreakdown : [];

          const productItems = productBreakdown.slice(0, 30).map((item: any) => ({
            id: `stock-product-${item.id || item.sku || item.name}`,
            title: item.name || 'Sản phẩm tồn kho',
            subtitle: `Tồn kho • SKU: ${item.sku || '--'} • Nhóm: ${item.category || '--'}`,
            href: '/inventory',
            section: 'Tồn kho',
            searchText: buildSearchText(item.name, item.sku, item.category, String(item.total), String(item.inStock), String(item.outOfStock), String(item.missing)),
          }));

          const categoryItems = categoryBreakdown.slice(0, 20).map((item: any, index: number) => ({
            id: `stock-category-${item.name || index}`,
            title: item.name || 'Danh mục tồn kho',
            subtitle: `Phân tích tồn kho theo danh mục • Tổng: ${item.total ?? 0}`,
            href: '/inventory',
            section: 'Tồn kho',
            searchText: buildSearchText(item.name, String(item.total), String(item.inStock), String(item.outOfStock)),
          }));

          return [...productItems, ...categoryItems];
        } catch {
          return [];
        }
      };

      const [products, categories, tags, orders, locations, users, sessions, transfers, activityLogs, stockItems] = await Promise.all([
        fetchAndMap(`/products?search=${safeKeyword}&limit=8`, (item) => ({
          id: `product-${item.id}`,
          title: item.name || item.sku || 'Sản phẩm',
          subtitle: `Sản phẩm${item.sku ? ` • SKU: ${item.sku}` : ''}${item.category?.name ? ` • ${item.category.name}` : ''}`,
          href: '/products',
          section: 'Sản phẩm',
          searchText: buildSearchText(item.name, item.sku, item.description, item.category?.name),
        })),
        fetchAndMap(`/categories?search=${safeKeyword}&limit=8`, (item) => ({
          id: `category-${item.id}`,
          title: item.name || 'Danh mục',
          subtitle: `Danh mục${item.description ? ` • ${item.description}` : ''}`,
          href: '/categories',
          section: 'Danh mục',
          searchText: buildSearchText(item.name, item.description),
        })),
        fetchAndMap(`/tags?search=${safeKeyword}&limit=8`, (item) => ({
          id: `tag-${item.id}`,
          title: item.epc || 'RFID Tag',
          subtitle: `Thẻ RFID${item.product?.name ? ` • ${item.product.name}` : ''}${item.status ? ` • ${item.status}` : ''}`,
          href: '/tags',
          section: 'Thẻ RFID',
          searchText: buildSearchText(item.epc, item.product?.name, item.product?.sku, item.status),
        })),
        fetchAndMap(`/orders?search=${safeKeyword}&limit=8`, (item) => ({
          id: `order-${item.id}`,
          title: item.code || 'Đơn hàng',
          subtitle: `Đơn hàng${item.type ? ` • ${item.type}` : ''}${item.status ? ` • ${item.status}` : ''}`,
          href: '/orders',
          section: 'Đơn hàng',
          searchText: buildSearchText(item.code, item.type, item.status, item.createdBy?.username),
        })),
        fetchAndMap(`/locations?search=${safeKeyword}&limit=8`, (item) => ({
          id: `location-${item.id}`,
          title: item.name || item.code || 'Địa điểm',
          subtitle: `Địa điểm${item.code ? ` • ${item.code}` : ''}${item.address ? ` • ${item.address}` : ''}`,
          href: '/locations',
          section: 'Địa điểm',
          searchText: buildSearchText(item.name, item.code, item.type, item.address),
        })),
        fetchAndMap(`/users?search=${safeKeyword}&limit=8`, (item) => ({
          id: `user-${item.id}`,
          title: item.username || 'Người dùng',
          subtitle: `Người dùng${item.role ? ` • ${item.role}` : ''}${item.location?.name ? ` • ${item.location.name}` : ''}`,
          href: '/users',
          section: 'Người dùng',
          adminOnly: true,
          searchText: buildSearchText(item.username, item.role, item.location?.name, item.location?.code),
        })),
        fetchAndMap('/sessions?limit=40', (item) => ({
          id: `session-${item.id}`,
          title: item.name || 'Phiên quét',
          subtitle: `Phiên quét${item.order?.code ? ` • Đơn: ${item.order.code}` : ''}${item.user?.username ? ` • ${item.user.username}` : ''}`,
          href: '/sessions',
          section: 'Phiên quét',
          searchText: buildSearchText(item.name, item.order?.code, item.order?.type, item.user?.username),
        })),
        fetchAndMap('/transfers?limit=40', (item) => ({
          id: `transfer-${item.id}`,
          title: item.code || 'Điều chuyển',
          subtitle: `Điều chuyển${item.source?.name ? ` • ${item.source.name}` : ''}${item.destination?.name ? ` -> ${item.destination.name}` : ''}`,
          href: '/transfers',
          section: 'Điều chuyển',
          searchText: buildSearchText(item.code, item.type, item.status, item.source?.name, item.destination?.name, item.createdBy?.username),
        })),
        fetchAndMap('/activity-logs?limit=40', (item) => ({
          id: `activity-${item.id}`,
          title: `${item.action || 'Hành động'}${item.entity ? ` • ${item.entity}` : ''}`,
          subtitle: `Nhật ký hệ thống${item.user?.username ? ` • ${item.user.username}` : ''}`,
          href: '/activity-logs',
          section: 'Nhật ký',
          adminOnly: true,
          searchText: buildSearchText(item.action, item.entity, item.user?.username, item.ipAddress, JSON.stringify(item.details || {})),
        })),
        fetchStockSearchItems(),
      ]);

      const merged = [
        ...staticResults,
        ...products,
        ...categories,
        ...tags,
        ...orders,
        ...locations,
        ...users,
        ...sessions,
        ...transfers,
        ...activityLogs,
        ...stockItems,
      ]
        .filter((item) => !item.adminOnly || isSuperAdmin(user?.role))
        .filter((item) => matchesAllTerms(trimmed, [item.title, item.subtitle, item.section, item.searchText, ...(item.keywords || [])]))
        .map((item, index) => ({
          ...item,
          score: scoreSearchResult(trimmed, item) - Math.min(index, 15),
        }));

      const dedupedMap = new Map<string, SearchResultItem>();
      for (const item of merged) {
        const dedupeKey = `${item.section}:${normalizeText(item.title)}:${item.href}`;
        if (!dedupedMap.has(dedupeKey)) {
          dedupedMap.set(dedupeKey, item);
        }
      }

      if (!isCancelled) {
        setSearchResults(
          Array.from(dedupedMap.values())
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, 15),
        );
        setIsSearching(false);
      }
    };

    const timer = setTimeout(searchAll, 280);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchKeyword, user?.role]);

  const onSelectSearchResult = (item: SearchResultItem) => {
    setIsSearchOpen(false);
    setSearchKeyword(item.title);

    const supportedSearchPaths = new Set([
      '/products',
      '/categories',
      '/tags',
      '/orders',
      '/locations',
      '/users',
      '/permissions',
      '/sessions',
      '/transfers',
      '/inventory',
      '/activity-logs',
    ]);

    const trimmed = searchKeyword.trim();
    if (trimmed && supportedSearchPaths.has(item.href)) {
      router.push(`${item.href}?search=${encodeURIComponent(trimmed)}`);
      return;
    }

    router.push(item.href);
  };

  return (
    <header className="h-[60px] bg-white border-b border-slate-100 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40">
      {/* Left section */}
      <div className="flex items-center gap-2 sm:gap-4 w-full lg:w-auto">
        <button onClick={onMenuClick} className="lg:hidden p-1.5 -ml-1 text-slate-500 hover:bg-slate-100 rounded-lg shrink-0">
          <Menu className="w-[18px] h-[18px]" />
        </button>
        <div className="hidden lg:flex items-center gap-2 text-[13px] font-medium shrink-0 lg:ml-2">
          <span className="text-slate-400">Điều hướng</span>
          <span className="text-slate-300">›</span>
          <span className="text-primary font-bold">{getPageName(pathname)}</span>
        </div>

        <div className="relative group flex-1 lg:ml-6" ref={searchRef}>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            value={searchKeyword}
            onFocus={() => {
              setIsSearchOpen(true);
              setSearchResults(getStaticResults(searchKeyword));
            }}
            onChange={(event) => {
              setSearchKeyword(event.target.value);
              setIsSearchOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && searchResults.length > 0) {
                onSelectSearchResult(searchResults[0]);
              }
            }}
            placeholder="Tìm kiếm toàn hệ thống..."
            className="w-full sm:w-56 lg:w-72 h-9 pl-9 pr-4 bg-slate-50 border border-transparent hover:border-slate-200 focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/10 rounded-full text-[13px] outline-none transition-all placeholder:text-slate-400 text-slate-700"
          />

          {isSearchOpen && (
            <div className="absolute left-0 right-0 top-11 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/60 overflow-hidden z-50">
              <div className="max-h-80 overflow-y-auto">
                {isSearching ? (
                  <div className="px-4 py-3 text-[12px] text-slate-500">Đang tìm kiếm...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectSearchResult(item)}
                      className="w-full px-4 py-2.5 text-left hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
                    >
                      <div className="text-[13px] font-semibold text-slate-800">{renderHighlightedText(item.title, searchKeyword)}</div>
                      <div className="text-[11px] text-slate-500">{renderHighlightedText(`${item.section} • ${item.subtitle}`, searchKeyword)}</div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-4 text-[12px] text-slate-500">Không tìm thấy kết quả phù hợp.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden sm:flex items-center gap-3 pr-2">
          <button className="relative w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-all">
            <Bell className="w-[18px] h-[18px] stroke-2" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 border border-white rounded-full"></span>
          </button>
          <button className="relative w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-all">
            <Settings className="w-[18px] h-[18px] stroke-2" />
          </button>
        </div>

        <div className="hidden sm:block w-px h-6 bg-slate-100"></div>

        <div className="relative" ref={profileRef}>
          <div
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[13px] font-bold text-slate-800 group-hover:text-primary transition-colors">
                {user?.username || 'Admin User'}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {roleText}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs tracking-widest shadow-sm group-hover:shadow-primary/30 transition-shadow">
                {getInitials(user?.username)}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>

          {/* Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg shadow-slate-200/50 border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 border-b border-slate-50 mb-1">
                <p className="text-[13px] font-semibold text-slate-800">{user?.username || 'Admin User'}</p>
                <p className="text-[10px] text-slate-500 truncate">{isSuperAdmin(user?.role) ? 'Phiên làm việc quản trị' : 'Phiên bảo mật kho'}</p>
              </div>

              <button
                onClick={() => setIsProfileOpen(false)}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                Hồ sơ cá nhân
              </button>

              <div className="h-px bg-slate-100 my-1"></div>

              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
