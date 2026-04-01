import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { QueryLocationsDto } from './dto/query-locations.dto';
import { BusinessException } from '@common/exceptions/business.exception';
import { PaginationHelper } from '@common/helpers/pagination.helper';
import { plainToInstance } from 'class-transformer';
import { LocationEntity } from './entities/location.entity';
import { Prisma } from '.prisma/client';

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryLocationsDto) {
    const { page = 1, limit = 20, search, type } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.LocationWhereInput = {
      deletedAt: null,
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
    } else {
      where.type = { not: 'WORKSHOP_WAREHOUSE' };
    }

    const [data, total] = await Promise.all([
      this.prisma.location.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { 
          _count: { select: { tags: true } },
          createdBy: { select: { id: true, username: true } },
          updatedBy: { select: { id: true, username: true } },
          children: {
            where: { deletedAt: null },
            select: { id: true, code: true, name: true, type: true, address: true }
          }
        },
      }),
      this.prisma.location.count({ where }),
    ]);

    const formattedData = data.map((i) => plainToInstance(LocationEntity, i));
    return PaginationHelper.paginate(formattedData, total, page, limit);
  }

  async findOne(id: string) {
    const location = await this.prisma.location.findFirst({
      where: { id, deletedAt: null },
      include: { 
        _count: { select: { tags: true } },
        createdBy: { select: { id: true, username: true } },
        updatedBy: { select: { id: true, username: true } },
      },
    });
    if (!location) throw new BusinessException(`Không tìm thấy vị trí với ID "${id}"`, 'LOCATION_NOT_FOUND', HttpStatus.NOT_FOUND);
    return plainToInstance(LocationEntity, location);
  }

  async create(dto: CreateLocationDto, userId?: string) {
    // Check code uniqueness
    const existing = await this.prisma.location.findFirst({ where: { code: dto.code, deletedAt: null } });
    if (existing) throw new BusinessException(`Mã vị trí "${dto.code}" đã tồn tại`, 'LOCATION_EXISTS', HttpStatus.BAD_REQUEST);

    const location = await this.prisma.location.create({
      data: {
        ...dto,
        createdById: userId || undefined,
        updatedById: userId || undefined,
      },
      include: { _count: { select: { tags: true } } },
    });

    if (location.type === 'WORKSHOP') {
      const warehouseCode = `WH-${location.code}`;
      const existingWH = await this.prisma.location.findFirst({ where: { code: warehouseCode, deletedAt: null } });
      if (!existingWH) {
        await this.prisma.location.create({
          data: {
            code: warehouseCode,
            name: `Kho - ${location.name}`,
            type: 'WORKSHOP_WAREHOUSE',
            address: location.address,
            parentId: location.id,
            createdById: userId || undefined,
            updatedById: userId || undefined,
          }
        });
      }
    }

    return plainToInstance(LocationEntity, location);
  }

  async update(id: string, dto: UpdateLocationDto, userId?: string) {
    const location = await this.prisma.location.findFirst({ where: { id, deletedAt: null } });
    if (!location) throw new BusinessException(`Không tìm thấy vị trí với ID "${id}"`, 'LOCATION_NOT_FOUND', HttpStatus.NOT_FOUND);

    // D-03: Only name and address are editable, type and code are fixed
    const updated = await this.prisma.location.update({
      where: { id },
      data: {
        ...dto,
        updatedById: userId || undefined,
      },
      include: { _count: { select: { tags: true } } },
    });
    return plainToInstance(LocationEntity, updated);
  }

  async remove(id: string, userId?: string) {
    const location = await this.prisma.location.findFirst({
      where: { id, deletedAt: null },
      include: { _count: { select: { tags: true } } },
    });
    if (!location) throw new BusinessException(`Không tìm thấy vị trí với ID "${id}"`, 'LOCATION_NOT_FOUND', HttpStatus.NOT_FOUND);

    // D-04: Cannot delete location that has tags
    if (location._count.tags > 0) {
      throw new BusinessException(
        `Không thể xóa vị trí đang có ${location._count.tags} tags`,
        'HAS_ACTIVE_TAGS',
        HttpStatus.BAD_REQUEST
      );
    }

    const now = new Date();
    await this.prisma.location.update({
      where: { id },
      data: { 
        deletedAt: now,
        deletedById: userId || undefined,
      },
    });

    if (location.type === 'WORKSHOP') {
      await this.prisma.location.updateMany({
        where: { parentId: id, deletedAt: null },
        data: {
          deletedAt: now,
          deletedById: userId || undefined,
        }
      });
    }

    return { id, deletedAt: now };
  }

  async syncWarehouses(userId?: string) {
    const workshops = await this.prisma.location.findMany({
      where: { type: 'WORKSHOP', deletedAt: null },
      include: {
        children: { where: { type: 'WORKSHOP_WAREHOUSE', deletedAt: null } }
      }
    });

    let createdCount = 0;
    for (const ws of workshops) {
      if (ws.children.length === 0) {
        const warehouseCode = `WH-${ws.code}`;
        await this.prisma.location.create({
          data: {
            code: warehouseCode,
            name: `Kho - ${ws.name}`,
            type: 'WORKSHOP_WAREHOUSE',
            address: ws.address,
            parentId: ws.id,
            createdById: userId || undefined,
            updatedById: userId || undefined,
          }
        });
        createdCount++;
      }
    }

    // Move stuck tags (IN_WORKSHOP logically sitting at WORKSHOP without warehouse) into the new WORKSHOP_WAREHOUSE.
    const stuckTags = await this.prisma.tag.findMany({
      where: { status: 'IN_WORKSHOP', locationRel: { type: 'WORKSHOP' } },
    });

    let movedTagsCount = 0;
    if (stuckTags.length > 0) {
      for (const tag of stuckTags) {
        const warehouse = await this.prisma.location.findFirst({
          where: { parentId: tag.locationId, type: 'WORKSHOP_WAREHOUSE', deletedAt: null }
        });
        if (warehouse) {
          await this.prisma.tag.update({
            where: { id: tag.id },
            data: { status: 'IN_WAREHOUSE', locationId: warehouse.id }
          });
          movedTagsCount++;
        }
      }
    }

    return { message: `Đã tạo ${createdCount} Kho Xưởng và giải cứu ${movedTagsCount} thẻ bị kẹt.` };
  }
}
