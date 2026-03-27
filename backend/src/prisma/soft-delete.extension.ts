import { Prisma } from '.prisma/client';

/**
 * Prisma Extension tự động filter soft-deleted records.
 * Áp dụng cho các model có trường `deletedAt`.
 * Mọi query findMany/findFirst/findUnique/count sẽ auto thêm `where: { deletedAt: null }`.
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

export const softDeleteExtension = Prisma.defineExtension({
  name: 'softDelete',
  query: {
    $allModels: {
      async findMany({ model, args, query }) {
        if (SOFT_DELETE_MODELS.includes(model as Prisma.ModelName)) {
          args.where = { ...(args.where as SoftDeleteWhere), deletedAt: null };
        }
        return query(args);
      },
      async findFirst({ model, args, query }) {
        if (SOFT_DELETE_MODELS.includes(model as Prisma.ModelName)) {
          args.where = { ...(args.where as SoftDeleteWhere), deletedAt: null };
        }
        return query(args);
      },
      async findUnique({ model, args, query }) {
        // findUnique không hỗ trợ trực tiếp thêm điều kiện `deletedAt`
        // nên ta chỉ filter ở findMany/findFirst, findUnique giữ nguyên.
        return query(args);
      },
      async count({ model, args, query }) {
        if (SOFT_DELETE_MODELS.includes(model as Prisma.ModelName)) {
          args.where = { ...(args.where as SoftDeleteWhere), deletedAt: null };
        }
        return query(args);
      },
    },
  },
});
