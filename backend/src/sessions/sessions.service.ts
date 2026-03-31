import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { QuerySessionsDto } from './dto/query-sessions.dto';
import { EventsGateway } from '../events/events.gateway';
import { Prisma, TagStatus } from '.prisma/client';
import { BusinessException } from '@common/exceptions/business.exception';
import { PaginationHelper } from '@common/helpers/pagination.helper';
import { plainToInstance } from 'class-transformer';
import { SessionEntity } from './entities/session.entity';

@Injectable()
export class SessionsService {
  constructor(
    private prisma: PrismaService,
    private events: EventsGateway
  ) {}

  async findAll(query: QuerySessionsDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.session.findMany({
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
        include: { 
          _count: { select: { scans: true } },
          user: { select: { id: true, username: true } },
          order: { select: { id: true, code: true, type: true } },
          scans: {
            where: { tag: { productId: null } },
            take: 1,
            select: { id: true }
          }
        },
      }),
      this.prisma.session.count(),
    ]);

    const formattedData = data.map(item => plainToInstance(SessionEntity, { 
      ...item, 
      totalScans: item._count?.scans || 0,
      hasUnassignedTags: item.scans && item.scans.length > 0
    }));
    return PaginationHelper.paginate(formattedData, total, page, limit);
  }

  async assignProductToSession(sessionId: string, productId: string, userId: string) {
    // Check if session exists and fetch associated scans
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { scans: { select: { tagEpc: true } } }
    });
    
    if (!session) {
      throw new BusinessException('Không tìm thấy phiên quét', 'SESSION_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    // Check if product exists
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new BusinessException('Không tìm thấy sản phẩm', 'PRODUCT_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    const uniqueEpcs = Array.from(new Set(session.scans.map(s => s.tagEpc)));
    if (uniqueEpcs.length === 0) {
      throw new BusinessException('Phiên quét trống, không có thẻ nào để gán.', 'SESSION_EMPTY', HttpStatus.BAD_REQUEST);
    }

    const count = await this.prisma.$transaction(async (tx) => {
      // Find tags that match these epcs to get their ids for events
      const tagsToUpdate = await tx.tag.findMany({ where: { epc: { in: uniqueEpcs }, deletedAt: null } });
      const tagIds = tagsToUpdate.map(t => t.id);

      // Update tags to point to the new productId and update status
      const updateResult = await tx.tag.updateMany({
        where: { epc: { in: uniqueEpcs }, deletedAt: null },
        data: {
          productId: productId,
          status: TagStatus.IN_WORKSHOP, // Default for manual assignment
          updatedById: userId
        }
      });

      // Create tag events for the bulk update
      if (tagIds.length > 0) {
        await tx.tagEvent.createMany({
          data: tagIds.map(tagId => ({
            tagId,
            type: 'ASSIGNED',
            description: `Gán đè cho Sản phẩm: ${product.name} (Từ Phiên: ${session.name})`,
            userId
          }))
        });
      }

      return updateResult.count;
    });

    return { count };
  }

  async create(dto: CreateSessionDto, userId?: string) {
    const scans = dto.scans || [];
    const uniqueEpcs = Array.from(new Set(scans.map((s) => s.epc)));

    const session = await this.prisma.$transaction(async (tx) => {
      // Find the order if orderId is provided
      let order = null;
      if (dto.orderId) {
        order = await tx.order.findUnique({
          where: { id: dto.orderId },
          include: { items: true, location: true }
        });
        if (!order) throw new BusinessException('Không tìm thấy đơn hàng', 'ORDER_NOT_FOUND', HttpStatus.NOT_FOUND);
        if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
          throw new BusinessException(`Không thể xử lý phiên quét cho đơn hàng đang ở trạng thái ${order.status}`, 'INVALID_STATUS_TRANSITION', HttpStatus.BAD_REQUEST);
        }
      }

      // 1. Ensure all tags exist before creating scans
      if (uniqueEpcs.length > 0) {
        await tx.tag.createMany({
          data: uniqueEpcs.map(epc => ({ epc })),
          skipDuplicates: true,
        });
      }

      // Lấy thông tin tags sau khi create (để biết tag nào của Product nào)
      const scannedTagsInfo = await tx.tag.findMany({
        where: { epc: { in: uniqueEpcs } },
        include: { product: true }
      });

      // 2. Process Order Fulfillment if orderId presents
      let tagsToUpdateStatus: TagStatus | null = null;
      let targetLocationId: string | null = null;
      
      if (order) {
        if (order.status === 'PENDING') {
          await tx.order.update({ where: { id: order.id }, data: { status: 'IN_PROGRESS' } });
          order.status = 'IN_PROGRESS';
        }
        
        // Group scanned tags by productId
        const productCounts: Record<string, number> = {};
        for (const t of scannedTagsInfo) {
          if (t.productId) {
            productCounts[t.productId] = (productCounts[t.productId] || 0) + 1;
          }
        }

        let allCompleted = true;

        for (const item of order.items) {
          const scannedCount = productCounts[item.productId] || 0;
          if (scannedCount > 0) {
            const newScannedQty = item.scannedQuantity + scannedCount;
            await tx.orderItem.update({
              where: { id: item.id },
              data: { scannedQuantity: newScannedQty }
            });
            if (newScannedQty < item.quantity) allCompleted = false;
          } else {
            if (item.scannedQuantity < item.quantity) allCompleted = false;
          }
        }

        if (allCompleted) {
          await tx.order.update({ where: { id: order.id }, data: { status: 'COMPLETED' } });
        }

        // Determine tag status destination
        if (order.type === 'OUTBOUND') {
          tagsToUpdateStatus = TagStatus.COMPLETED; // Xuất kho
        } else if (order.type === 'INBOUND') {
          if (order.location?.type === 'WORKSHOP') {
            tagsToUpdateStatus = TagStatus.IN_WORKSHOP;
          } else {
            tagsToUpdateStatus = TagStatus.IN_WAREHOUSE;
          }
          targetLocationId = order.locationId;
        }
      }

      // 3. Create the Session + Scans
      const newSession = await tx.session.create({
        data: {
          name: dto.name,
          totalTags: uniqueEpcs.length,
          endedAt: new Date(),
          ...(dto.orderId ? { order: { connect: { id: dto.orderId } } } : {}),
          ...(userId ? { user: { connect: { id: userId } } } : {}),
          scans: {
            create: scans.map((s) => ({
              tag: { connect: { epc: s.epc } },
              rssi: s.rssi,
              scannedAt: new Date(s.time),
            })),
          },
        },
        include: { scans: true },
      });

      // 4. Update all scanned tags (location, lastSeenAt, new status if needed)
      const now = new Date();
      await tx.tag.updateMany({
        where: { epc: { in: uniqueEpcs } },
        data: {
          location: dto.name,
          lastSeenAt: now,
          ...(tagsToUpdateStatus ? { status: tagsToUpdateStatus } : {}),
          ...(targetLocationId ? { locationId: targetLocationId } : {})
        }
      });

      // 5. Create SCANNED / ORDERED TagEvents
      if (scannedTagsInfo.length > 0) {
        await tx.tagEvent.createMany({
          data: scannedTagsInfo.map(tag => ({
            tagId: tag.id,
            type: order ? (order.type === 'INBOUND' ? 'INBOUND' : 'OUTBOUND') : 'SCANNED',
            location: dto.name,
            description: order ? `Xử lý đơn hàng: ${order.code}` : `Được quét trong phiên: ${dto.name}`,
            userId
          }))
        });
      }

      // 6. Detect MISSING tags (only if this is a general scan, NOT an order fulfillment)
      if (!order) {
        const missingTags = await tx.tag.findMany({
          where: { 
            location: dto.name, 
            epc: { notIn: uniqueEpcs }, 
            status: { not: 'MISSING' } 
          }
        });

        if (missingTags.length > 0) {
          const missingTagIds = missingTags.map(t => t.id);
          await tx.tag.updateMany({
            where: { id: { in: missingTagIds } },
            data: { status: 'MISSING' }
          });
          
          await tx.tagEvent.createMany({
            data: missingTagIds.map(tagId => ({
              tagId,
              type: 'MISSING',
              location: dto.name,
              description: `Không tìm thấy trong đợt kiểm kê: ${dto.name}`,
              userId
            }))
          });
        }
      }

      return newSession;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });

    // Notify clients about order update
    if (dto.orderId) {
       const updatedOrder = await this.prisma.order.findUnique({
         where: { id: dto.orderId },
         include: { items: { include: { product: true } } }
       });
       if (updatedOrder) {
         this.events.server.emit('orderUpdate', updatedOrder);
       }
    }

    return plainToInstance(SessionEntity, session);
  }

  async findOne(id: string) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: {
        scans: {
          include: {
            tag: {
              include: {
                product: {
                  select: { name: true, sku: true, category: { select: { name: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!session) throw new BusinessException(`Không tìm thấy phiên quét với ID "${id}"`, 'SESSION_NOT_FOUND', HttpStatus.NOT_FOUND);

    // Merge: mỗi tag 1 dòng, lấy lần quét cuối cùng
    const mergedScans = new Map<string, (typeof session.scans)[0]>();
    for (const scan of session.scans) {
      const existing = mergedScans.get(scan.tagEpc);
      if (!existing || existing.scannedAt < scan.scannedAt) {
        mergedScans.set(scan.tagEpc, scan);
      }
    }

    return plainToInstance(SessionEntity, { ...session, scans: Array.from(mergedScans.values()) });
  }
}
