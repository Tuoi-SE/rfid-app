import { Prisma } from '.prisma/client';

/**
 * Prisma Extension tự động filter soft-deleted records.
 * Áp dụng cho các model có trường `deletedAt`.
 * Mọi query findMany/findFirst/findUnique/count sẽ auto thêm `where: { deletedAt: null }`.
 *
 * QUAN TRỌNG: Nếu query đã có `deletedAt` filter rõ ràng (vd: `{ not: null }`),
 * extension sẽ KHÔNG can thiệp — cho phép service tự kiểm soát.
 */

const SOFT_DELETE_MODELS: Prisma.ModelName[] = [
  'User',
  'Category',
  'Product',
  'Tag',
  'Location',
  'Order',
];

type SoftDeleteWhere = { deletedAt?: unknown };

/** Kiểm tra xem query đã có filter `deletedAt` hay chưa */
function hasExplicitDeletedAtFilter(where: SoftDeleteWhere | undefined): boolean {
  return where !== undefined && 'deletedAt' in where;
}

export const softDeleteExtension = Prisma.defineExtension({
  name: 'softDelete',
  query: {
    $allModels: {
      async findMany({ model, args, query }) {
        if (SOFT_DELETE_MODELS.includes(model as Prisma.ModelName) && !hasExplicitDeletedAtFilter(args.where as SoftDeleteWhere)) {
          args.where = { ...(args.where as SoftDeleteWhere), deletedAt: null };
        }
        return query(args);
      },
      async findFirst({ model, args, query }) {
        if (SOFT_DELETE_MODELS.includes(model as Prisma.ModelName) && !hasExplicitDeletedAtFilter(args.where as SoftDeleteWhere)) {
          args.where = { ...(args.where as SoftDeleteWhere), deletedAt: null };
        }
        return query(args);
      },
      async findUnique({ model, args, query }) {
        return query(args);
      },
      async count({ model, args, query }) {
        if (SOFT_DELETE_MODELS.includes(model as Prisma.ModelName) && !hasExplicitDeletedAtFilter(args.where as SoftDeleteWhere)) {
          args.where = { ...(args.where as SoftDeleteWhere), deletedAt: null };
        }
        return query(args);
      },
    },
  },
});

