import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { AssignTagsDto } from './dto/bulk-update.dto';
import { QueryTagsDto } from './dto/query-tags.dto';
import { Prisma } from '.prisma/client';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryTagsDto) {
    const { page = 1, limit = 50, search, productId, status, unassigned } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TagWhereInput = {};
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

    const [data, total] = await Promise.all([
      this.prisma.tag.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          product: {
            select: { id: true, name: true, sku: true, category: { select: { id: true, name: true } } },
          },
        },
      }),
      this.prisma.tag.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByEpc(epc: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { epc },
      include: {
        product: {
          select: { id: true, name: true, sku: true, category: { select: { id: true, name: true } } },
        },
      },
    });
    if (!tag) throw new NotFoundException(`Không tìm thấy tag với EPC "${epc}"`);
    return tag;
  }

  async getHistory(epc: string) {
    const tag = await this.prisma.tag.findUnique({ where: { epc } });
    if (!tag) throw new NotFoundException(`Không tìm thấy tag với EPC "${epc}"`);

    return this.prisma.tagEvent.findMany({
      where: { tagId: tag.id },
      orderBy: { createdAt: 'desc' },
      include: {
        // Có thể join với User nếu cần hiện tên NV
        // Nhưng tạm thời user model ko có relation 2 chiều tới tagEvent (hoặc không lấy tên dc, ta cứ trả ID)
      }
    });
  }

  async create(dto: CreateTagDto, userId?: string) {
    const existing = await this.prisma.tag.findUnique({ where: { epc: dto.epc } });
    if (existing) throw new ConflictException(`Tag với EPC "${dto.epc}" đã tồn tại`);
    
    return this.prisma.$transaction(async (tx) => {
      const tag = await tx.tag.create({ data: { epc: dto.epc } });
      await tx.tagEvent.create({
        data: {
          tagId: tag.id,
          type: 'CREATED',
          description: 'Khởi tạo thẻ trắng',
          userId
        }
      });
      return tag;
    });
  }

  async update(epc: string, dto: UpdateTagDto, userId?: string) {
    const tag = await this.prisma.tag.findUnique({ where: { epc } });
    if (!tag) throw new NotFoundException(`Không tìm thấy tag với EPC "${epc}"`);

    if (dto.productId) {
      const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
      if (!product) throw new NotFoundException(`Không tìm thấy sản phẩm với ID "${dto.productId}"`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedTag = await tx.tag.update({
        where: { epc },
        data: dto,
        include: {
          product: {
            select: { id: true, name: true, sku: true },
          },
        },
      });

      // Tạo sự kiện nếu có đổi thông tin quan trọng
      let desc = [];
      if (dto.productId && dto.productId !== tag.productId) desc.push(`Đổi Sản phẩm`);
      if (dto.status && dto.status !== tag.status) desc.push(`Cập nhật trạng thái thành ${dto.status}`);
      // Nếu có field location sau này thêm vào UpdateTagDto:
      // if (dto.location && dto.location !== tag.location) desc.push(`Di chuyển tới ${dto.location}`);

      if (desc.length > 0) {
        await tx.tagEvent.create({
          data: {
            tagId: tag.id,
            type: 'UPDATED',
            description: desc.join(', '),
            userId
          }
        });
      }

      return updatedTag;
    });
  }

  async assignTags(dto: AssignTagsDto, userId?: string) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException(`Không tìm thấy sản phẩm với ID "${dto.productId}"`);

    // AssignTags chỉ cung cấp tagIds (dạng ID, không phải EPC)
    const result = await this.prisma.$transaction(async (tx) => {
      const updateResult = await tx.tag.updateMany({
        where: { id: { in: dto.tagIds } },
        data: { productId: dto.productId, status: 'IN_STOCK' }, // Reset trạng thái thành IN_STOCK khi gán sp mới
      });

      await tx.tagEvent.createMany({
        data: dto.tagIds.map(tagId => ({
          tagId,
          type: 'ASSIGNED',
          description: `Được gán cho Sản phẩm: ${product.name}`,
          userId
        }))
      });

      return updateResult;
    });

    return { success: true, count: result.count };
  }

  async remove(epc: string) {
    const tag = await this.prisma.tag.findUnique({ where: { epc } });
    if (!tag) throw new NotFoundException(`Không tìm thấy tag với EPC "${epc}"`);
    await this.prisma.tag.delete({ where: { epc } });
    return { success: true };
  }
}
