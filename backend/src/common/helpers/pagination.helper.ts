/**
 * PaginatedResult — Format chuẩn cho response có phân trang.
 *
 * Controller chỉ cần return PaginationHelper.paginate(items, total, page, limit)
 * → Interceptor sẽ auto-wrap thành:
 *
 * {
 *   "success": true,
 *   "message": "...",
 *   "data": {
 *     "items": [...],
 *     "pagination": { "page": 1, "limit": 20, "total": 100, "total_pages": 5 }
 *   }
 * }
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
}

/**
 * Helper class tạo paginated response.
 *
 * @param items — Danh sách items đã format
 * @param total — Tổng số records (trước pagination)
 * @param page — Trang hiện tại
 * @param limit — Số items mỗi trang
 * @returns { items, pagination: { page, limit, total, total_pages } }
 *
 * @example
 * const [items, total] = await Promise.all([...findMany, ...count]);
 * return PaginationHelper.paginate(items.map(format), total, query.page, query.limit);
 */
export class PaginationHelper {
  static paginate<T>(items: T[], total: number, page: number, limit: number): PaginatedResult<T> {
    return {
      items,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }
}
