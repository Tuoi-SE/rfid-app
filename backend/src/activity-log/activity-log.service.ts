import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryActivityLogDto } from './dto/query-activity-log.dto';
import { Prisma } from '.prisma/client';
import { PaginationHelper } from '@common/helpers/pagination.helper';
import { plainToInstance } from 'class-transformer';
import { ActivityLogEntity } from './entities/activity-log.entity';

export interface LogEntry {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

@Injectable()
export class ActivityLogService {
  constructor(private prisma: PrismaService) {}

  async log(entry: LogEntry) {
    return this.prisma.activityLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        details: entry.details as Prisma.JsonObject,
        ipAddress: entry.ipAddress,
      },
    });
  }

  async findAll(query: QueryActivityLogDto, requestingUserId?: string, isAdmin = false) {
    const { page = 1, limit = 30, action, entity, userId, from, to } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ActivityLogWhereInput = {};

    // Non-admin users can only see their own logs
    if (!isAdmin) {
      where.userId = requestingUserId;
    } else if (userId) {
      where.userId = userId;
    }

    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [data, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, username: true, role: true } },
        },
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    const formattedData = data.map((i) => plainToInstance(ActivityLogEntity, i));
    return PaginationHelper.paginate(formattedData, total, page, limit);
  }

  async getRecentActivity(count = 10) {
    const data = await this.prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: count,
      include: {
        user: { select: { id: true, username: true, role: true } },
      },
    });
    
    return data.map((i) => plainToInstance(ActivityLogEntity, i));
  }
}
