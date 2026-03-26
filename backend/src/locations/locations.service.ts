import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { QueryLocationsDto } from './dto/query-locations.dto';

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryLocationsDto) {
    const { page = 1, limit = 20, search, type } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null, // Only non-deleted
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Key filter: type=WORKSHOP for workshop management (D-06)
    if (type) {
      where.type = type;
    }

    const [data, total] = await Promise.all([
      this.prisma.location.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { _count: { select: { tags: true } } },
      }),
      this.prisma.location.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const location = await this.prisma.location.findUnique({
      where: { id },
      include: { _count: { select: { tags: true } } },
    });
    if (!location) throw new NotFoundException(`Không tìm thấy vị trí với ID "${id}"`);
    return location;
  }

  async create(dto: CreateLocationDto) {
    // Check code uniqueness
    const existing = await this.prisma.location.findUnique({ where: { code: dto.code } });
    if (existing) throw new BadRequestException(`Mã vị trí "${dto.code}" đã tồn tại`);

    return this.prisma.location.create({
      data: dto,
      include: { _count: { select: { tags: true } } },
    });
  }

  async update(id: string, dto: UpdateLocationDto) {
    const location = await this.prisma.location.findUnique({ where: { id } });
    if (!location) throw new NotFoundException(`Không tìm thấy vị trí với ID "${id}"`);

    // D-03: Only name and address are editable, type and code are fixed
    // UpdateLocationDto only allows name and address fields
    return this.prisma.location.update({
      where: { id },
      data: dto,
      include: { _count: { select: { tags: true } } },
    });
  }

  async remove(id: string) {
    const location = await this.prisma.location.findUnique({
      where: { id },
      include: { _count: { select: { tags: true } } },
    });
    if (!location) throw new NotFoundException(`Không tìm thấy vị trí với ID "${id}"`);

    // D-04: Cannot delete location that has tags
    if (location._count.tags > 0) {
      throw new BadRequestException(
        `Không thể xóa vị trí đang có ${location._count.tags} tags`,
      );
    }

    // Soft delete instead of hard delete
    await this.prisma.location.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }
}
