import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { Prisma } from '.prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryProductsDto) {
    const { page = 1, limit = 20, search, categoryId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};
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

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          category: { select: { id: true, name: true } },
          _count: { select: { tags: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        _count: { select: { tags: true } },
      },
    });
    if (!product) throw new NotFoundException(`Không tìm thấy sản phẩm với ID "${id}"`);
    return product;
  }

  async create(dto: CreateProductDto) {
    // Check category exists
    const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!category) throw new NotFoundException(`Không tìm thấy danh mục với ID "${dto.categoryId}"`);

    // Check SKU unique
    const existing = await this.prisma.product.findUnique({ where: { sku: dto.sku } });
    if (existing) throw new ConflictException(`Sản phẩm với SKU "${dto.sku}" đã tồn tại`);

    return this.prisma.product.create({
      data: dto,
      include: { category: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);

    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
      if (!category) throw new NotFoundException(`Không tìm thấy danh mục với ID "${dto.categoryId}"`);
    }

    if (dto.sku) {
      const existing = await this.prisma.product.findFirst({
        where: { sku: dto.sku, NOT: { id } },
      });
      if (existing) throw new ConflictException(`Sản phẩm với SKU "${dto.sku}" đã tồn tại`);
    }

    return this.prisma.product.update({
      where: { id },
      data: dto,
      include: { category: { select: { id: true, name: true } } },
    });
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { _count: { select: { tags: true } } },
    });
    if (!product) throw new NotFoundException(`Không tìm thấy sản phẩm với ID "${id}"`);
    if (product._count.tags > 0) {
      throw new BadRequestException(
        `Không thể xóa sản phẩm đang có ${product._count.tags} tag gắn`,
      );
    }
    await this.prisma.product.delete({ where: { id } });
    return { success: true };
  }
}
