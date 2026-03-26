import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoriesDto } from './dto/query-categories.dto';
import { Prisma } from '.prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryCategoriesDto) {
    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CategoryWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { _count: { select: { products: true } } },
      }),
      this.prisma.category.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!category) throw new NotFoundException(`Không tìm thấy danh mục với ID "${id}"`);
    return category;
  }

  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException(`Danh mục "${dto.name}" đã tồn tại`);
    return this.prisma.category.create({ data: dto });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);

    if (dto.name) {
      const existing = await this.prisma.category.findFirst({
        where: { name: dto.name, NOT: { id } },
      });
      if (existing) throw new ConflictException(`Danh mục "${dto.name}" đã tồn tại`);
    }

    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!category) throw new NotFoundException(`Không tìm thấy danh mục với ID "${id}"`);
    if (category._count.products > 0) {
      throw new BadRequestException(
        `Không thể xóa danh mục đang có ${category._count.products} sản phẩm`,
      );
    }
    await this.prisma.category.delete({ where: { id } });
    return { success: true };
  }
}
