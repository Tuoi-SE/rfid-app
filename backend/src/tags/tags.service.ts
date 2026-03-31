import { Injectable, HttpStatus, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '@prisma/prisma.service';
import { CreateTagDto } from '@tags/dto/create-tag.dto';
import { UpdateTagDto } from '@tags/dto/update-tag.dto';
import { AssignTagsDto } from '@tags/dto/bulk-update.dto';
import { QueryTagsDto } from '@tags/dto/query-tags.dto';
import { Prisma, TagStatus } from '.prisma/client';
import { BusinessException } from '@common/exceptions/business.exception';
import { PaginationHelper } from '@common/helpers/pagination.helper';
import { plainToInstance } from 'class-transformer';
import { TagEntity } from './entities/tag.entity';

@Injectable()
export class TagsService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Lấy danh sách tag (phân trang + lọc theo epc, product, status, unassigned)
   */
  async findAll(query: QueryTagsDto) {
    const { page = 1, limit = 50, search, productId, status, unassigned } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TagWhereInput = { deletedAt: null };
    if (search) {
      where.epc = { contains: search, mode: 'insensitive' };
    }
    if (productId) {
      where.productId = productId;
    }
    if (status) {
      where.status = status;
    }
    if (unassigned === 'true') {
      where.productId = null;
    }

    const [items, total] = await Promise.all([
      this.prisma.tag.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          product: {
            select: { id: true, name: true, sku: true, category: { select: { id: true, name: true } } },
          },
          createdBy: { select: { id: true, username: true } },
          updatedBy: { select: { id: true, username: true } },
        },
      }),
      this.prisma.tag.count({ where }),
    ]);

    const formattedItems = items.map((i) => plainToInstance(TagEntity, i));
    return PaginationHelper.paginate(formattedItems, total, page, limit);
  }

  /**
   * Lấy chi tiết 1 tag theo EPC
   * @throws TAG_NOT_FOUND
   */
  async findByEpc(epc: string) {
    const cacheKey = `tag:epc:${epc}`;

    // Try cache first (cache-aside pattern)
    const cached = await this.cacheManager.get<TagEntity>(cacheKey);
    if (cached) {
      return plainToInstance(TagEntity, cached);
    }

    // Cache miss - query database
    const tag = await this.prisma.tag.findFirst({
      where: { epc, deletedAt: null },
      include: {
        product: {
          select: { id: true, name: true, sku: true, category: { select: { id: true, name: true } } },
        },
        createdBy: { select: { id: true, username: true } },
        updatedBy: { select: { id: true, username: true } },
      },
    });

    if (!tag) {
      throw new BusinessException(`Không tìm thấy tag với EPC "${epc}"`, 'TAG_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    const result = plainToInstance(TagEntity, tag);

    // Populate cache with 5-minute TTL
    await this.cacheManager.set(cacheKey, result, 300000); // 5 minutes in ms

    return result;
  }

  /**
   * Lấy lịch sử sự kiện của 1 tag
   * @throws TAG_NOT_FOUND
   */
  async getHistory(epc: string) {
    const tag = await this.prisma.tag.findUnique({ where: { epc } });
    if (!tag) {
      throw new BusinessException(`Không tìm thấy tag với EPC "${epc}"`, 'TAG_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    return this.prisma.tagEvent.findMany({
      where: { tagId: tag.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Khởi tạo trắng một thẻ mới
   * @throws TAG_EXISTS
   */
  async create(dto: CreateTagDto, userId?: string) {
    const existing = await this.prisma.tag.findUnique({ where: { epc: dto.epc } });
    if (existing) {
      throw new BusinessException(`Tag với EPC "${dto.epc}" đã tồn tại`, 'TAG_EXISTS', HttpStatus.CONFLICT);
    }

    return this.prisma.$transaction(async (tx) => {
      const tag = await tx.tag.create({
        data: {
          epc: dto.epc,
          createdById: userId || undefined,
          updatedById: userId || undefined,
        },
        include: {
          createdBy: { select: { id: true, username: true } },
        },
      });
      await tx.tagEvent.create({
        data: {
          tagId: tag.id,
          type: 'CREATED',
          description: 'Khởi tạo thẻ trắng',
          userId,
        },
      });
      return plainToInstance(TagEntity, tag);
    });
  }

  /**
   * Cập nhật thông tin thẻ
   * @throws TAG_NOT_FOUND
   * @throws PRODUCT_NOT_FOUND
   */
  async update(epc: string, dto: UpdateTagDto, userId?: string) {
    const tag = await this.prisma.tag.findUnique({ where: { epc } });
    if (!tag) {
      throw new BusinessException(`Không tìm thấy tag với EPC "${epc}"`, 'TAG_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    if (dto.productId) {
      const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
      if (!product) {
        throw new BusinessException(`Không tìm thấy sản phẩm với ID "${dto.productId}"`, 'PRODUCT_NOT_FOUND', HttpStatus.NOT_FOUND);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedTag = await tx.tag.update({
        where: { epc },
        data: {
          ...dto,
          updatedById: userId || undefined,
        },
        include: {
          product: {
            select: { id: true, name: true, sku: true },
          },
          updatedBy: { select: { id: true, username: true } },
        },
      });

      const desc: string[] = [];
      if (dto.productId && dto.productId !== tag.productId) desc.push(`Đổi Sản phẩm`);
      if (dto.status && dto.status !== tag.status) desc.push(`Cập nhật trạng thái thành ${dto.status}`);

      if (desc.length > 0) {
        await tx.tagEvent.create({
          data: {
            tagId: tag.id,
            type: 'UPDATED',
            description: desc.join(', '),
            userId,
          },
        });
      }

      // Invalidate cache after successful update
      await this.cacheManager.del(`tag:epc:${epc}`);

      return plainToInstance(TagEntity, updatedTag);
    });
  }

  /**
   * Gán hàng loạt thẻ (đã khởi tạo) cho một sản phẩm cụ thể
   * @throws PRODUCT_NOT_FOUND
   */
  async assignTags(dto: AssignTagsDto, userId?: string) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) {
      throw new BusinessException(`Không tìm thấy sản phẩm với ID "${dto.productId}"`, 'PRODUCT_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    const count = await this.prisma.$transaction(async (tx) => {
      const updateResult = await tx.tag.updateMany({
        where: { id: { in: dto.tagIds }, deletedAt: null },
        data: {
          productId: dto.productId,
          status: TagStatus.IN_WORKSHOP,
          updatedById: userId || undefined,
        },
      });

      await tx.tagEvent.createMany({
        data: dto.tagIds.map((tagId) => ({
          tagId,
          type: 'ASSIGNED',
          description: `Được gán cho Sản phẩm: ${product.name}`,
          userId,
        })),
      });

      return updateResult.count;
    });

    return { count };
  }

  /**
   * Xóa mềm thẻ
   * @throws TAG_NOT_FOUND
   */
  async remove(epc: string, userId?: string) {
    const tag = await this.prisma.tag.findFirst({ where: { epc, deletedAt: null } });
    if (!tag) {
      throw new BusinessException(`Không tìm thấy tag với EPC "${epc}"`, 'TAG_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    const now = new Date();
    await this.prisma.tag.update({
      where: { epc },
      data: {
        deletedAt: now,
        deletedById: userId || undefined,
      },
    });

    return { epc, deletedAt: now };
  }
}
