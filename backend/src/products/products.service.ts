import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { CreateProductDto } from '@products/dto/create-product.dto';
import { UpdateProductDto } from '@products/dto/update-product.dto';
import { QueryProductsDto } from '@products/dto/query-products.dto';
import { Prisma } from '.prisma/client';
import { BusinessException } from '@common/exceptions/business.exception';
import { PaginationHelper } from '@common/helpers/pagination.helper';
import { plainToInstance } from 'class-transformer';
import { ProductEntity } from './entities/product.entity';

/** Select fields cho audit user */
const AUDIT_USER_SELECT = { id: true, username: true };

/** Select fields chuẩn cho Product response */
const PRODUCT_SELECT = {
  id: true,
  name: true,
  sku: true,
  description: true,
  category: { select: { id: true, name: true } },
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  createdBy: { select: AUDIT_USER_SELECT },
  updatedBy: { select: AUDIT_USER_SELECT },
  deletedBy: { select: AUDIT_USER_SELECT },
  _count: { select: { tags: true } },
};

/**
 * ProductsService — Quản lý sản phẩm.
 *
 * Chức năng: CRUD + soft delete + audit tracking.
 * Bảo vệ: không cho xóa sản phẩm đang có tag gắn.
 */
@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lấy danh sách sản phẩm có phân trang + tìm kiếm + lọc category.
   * Mặc định chỉ lấy sản phẩm chưa bị xóa mềm.
   */
  async findAll(query: QueryProductsDto) {
    const { page = 1, limit = 20, search, categoryId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = { deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: PRODUCT_SELECT,
      }),
      this.prisma.product.count({ where }),
    ]);

    const formattedItems = items.map((i) => plainToInstance(ProductEntity, i));
    return PaginationHelper.paginate(formattedItems, total, page, limit);
  }

  /**
   * Lấy chi tiết 1 sản phẩm (chỉ active).
   * @throws PRODUCT_NOT_FOUND (404)
   */
  async findOne(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      select: PRODUCT_SELECT,
    });
    if (!product) {
      throw new BusinessException('Không tìm thấy sản phẩm', 'PRODUCT_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    return plainToInstance(ProductEntity, product);
  }

  /**
   * Tạo sản phẩm mới. Ghi nhận created_by.
   * @throws CATEGORY_NOT_FOUND (404)
   * @throws PRODUCT_SKU_EXISTS (409)
   */
  async create(dto: CreateProductDto, operatorId?: string) {
    const category = await this.prisma.category.findFirst({
      where: { id: dto.categoryId, deletedAt: null },
    });
    if (!category) {
      throw new BusinessException('Không tìm thấy danh mục', 'CATEGORY_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    if (dto.sku) {
      const existing = await this.prisma.product.findUnique({ where: { sku: dto.sku } });
      if (existing) {
        throw new BusinessException('SKU đã tồn tại', 'PRODUCT_SKU_EXISTS', HttpStatus.CONFLICT);
      }
    }

    const product = await this.prisma.product.create({
      data: {
        ...dto,
        createdById: operatorId || undefined,
        updatedById: operatorId || undefined,
      },
      select: PRODUCT_SELECT,
    });
    return plainToInstance(ProductEntity, product);
  }

  /**
   * Cập nhật sản phẩm. Ghi nhận updated_by.
   * @throws PRODUCT_NOT_FOUND (404)
   * @throws CATEGORY_NOT_FOUND (404)
   * @throws PRODUCT_SKU_EXISTS (409)
   */
  async update(id: string, dto: UpdateProductDto, operatorId?: string) {
    await this.findOne(id);

    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, deletedAt: null },
      });
      if (!category) {
        throw new BusinessException('Không tìm thấy danh mục', 'CATEGORY_NOT_FOUND', HttpStatus.NOT_FOUND);
      }
    }

    if (dto.sku) {
      const existing = await this.prisma.product.findFirst({
        where: { sku: dto.sku, NOT: { id } },
      });
      if (existing) {
        throw new BusinessException('SKU đã tồn tại', 'PRODUCT_SKU_EXISTS', HttpStatus.CONFLICT);
      }
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...dto,
        updatedById: operatorId || undefined,
      },
      select: PRODUCT_SELECT,
    });
    return plainToInstance(ProductEntity, product);
  }

  /**
   * Xóa mềm sản phẩm. Không cho xóa nếu đang có tag gắn.
   * @throws PRODUCT_NOT_FOUND (404)
   * @throws PRODUCT_HAS_TAGS (400)
   */
  async remove(id: string, operatorId?: string) {
    const product: any = await this.findOne(id);
    if (product.tagCount > 0) {
      throw new BusinessException(
        `Không thể xóa sản phẩm đang có ${product.tagCount} tag gắn`,
        'PRODUCT_HAS_TAGS',
      );
    }

    const now = new Date();
    await this.prisma.product.update({
      where: { id },
      data: {
        deletedAt: now,
        deletedById: operatorId || undefined,
      },
    });

    const deletedByUser = operatorId
      ? await this.prisma.user.findUnique({ where: { id: operatorId }, select: AUDIT_USER_SELECT })
      : null;

    return {
      id,
      deleted_at: now.toISOString(),
      deleted_by: deletedByUser,
    };
  }

  /**
   * Khôi phục sản phẩm đã xóa mềm.
   * @throws PRODUCT_NOT_FOUND (404)
   * @throws PRODUCT_NOT_DELETED (400)
   */
  async restore(id: string, operatorId?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true, deletedAt: true },
    });

    if (!product) {
      throw new BusinessException('Không tìm thấy sản phẩm', 'PRODUCT_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    if (!product.deletedAt) {
      throw new BusinessException('Sản phẩm chưa bị xóa', 'PRODUCT_NOT_DELETED');
    }

    const restored = await this.prisma.product.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedById: null,
        ...(operatorId && { updatedById: operatorId }),
      },
      select: PRODUCT_SELECT,
    });
    return plainToInstance(ProductEntity, restored);
  }
}
