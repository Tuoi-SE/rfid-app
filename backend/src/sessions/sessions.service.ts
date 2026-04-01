import { Injectable, HttpStatus, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { QuerySessionsDto } from './dto/query-sessions.dto';
import { EventsGateway } from '../events/events.gateway';
import { Prisma, TagStatus, TransferStatus } from '.prisma/client';
import { BusinessException } from '@common/exceptions/business.exception';
import { PaginationHelper } from '@common/helpers/pagination.helper';
import { plainToInstance } from 'class-transformer';
import { SessionEntity } from './entities/session.entity';
import { AssignSessionStrategy } from './dto/assign-session-product.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class SessionsService {
  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findAll(
    query: QuerySessionsDto,
    user?: { id: string; role: string },
  ) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const sessionWhere: Prisma.SessionWhereInput =
      user && user.role !== 'ADMIN' ? { userId: user.id } : {};

    const scanWhere: Prisma.ScanWhereInput = {
      tag: { deletedAt: null },
      ...(user && user.role !== 'ADMIN'
        ? { session: { is: { userId: user.id } } }
        : {}),
    };

    const [data, total, distinctScannedTags] = await Promise.all([
      this.prisma.session.findMany({
        where: sessionWhere,
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: { select: { scans: true } },
          user: { select: { id: true, username: true } },
          order: { select: { id: true, code: true, type: true } },
        },
      }),
      this.prisma.session.count({ where: sessionWhere }),
      this.prisma.scan.findMany({
        where: scanWhere,
        distinct: ['tagEpc'],
        select: { tagEpc: true },
      }),
    ]);

    const distinctScannedTagCount = distinctScannedTags.length;

    const sessionIds = data.map((item) => item.id);
    const [unassignedSessions, assignedSessions, transferredSessions] = sessionIds.length
      ? await Promise.all([
          this.prisma.scan.findMany({
            where: {
              sessionId: { in: sessionIds },
              tag: { productId: null },
            },
            select: { sessionId: true },
            distinct: ['sessionId'],
          }),
          this.prisma.scan.findMany({
            where: {
              sessionId: { in: sessionIds },
              tag: { productId: { not: null } },
            },
            select: { sessionId: true },
            distinct: ['sessionId'],
          }),
          this.prisma.scan.findMany({
            where: {
              sessionId: { in: sessionIds },
              tag: {
                transferItems: {
                  some: {
                    transfer: {
                      status: { in: [TransferStatus.PENDING, TransferStatus.COMPLETED] },
                    },
                  },
                },
              },
            },
            select: { sessionId: true },
            distinct: ['sessionId'],
          }),
        ])
      : [[], [], []];

    const unassignedSessionIds = new Set(unassignedSessions.map((item) => item.sessionId));
    const assignedSessionIds = new Set(assignedSessions.map((item) => item.sessionId));
    const transferredSessionIds = new Set(transferredSessions.map((item) => item.sessionId));

    const formattedData = data.map((item) => plainToInstance(SessionEntity, {
      ...item,
      totalScans: item._count?.scans || 0,
      hasUnassignedTags: unassignedSessionIds.has(item.id),
      hasAssignedTags: assignedSessionIds.has(item.id),
      hasTransferredTags: transferredSessionIds.has(item.id),
    }));
    return {
      ...PaginationHelper.paginate(formattedData, total, page, limit),
      metrics: {
        distinctScannedTagCount,
      },
    };
  }

  async assignProductToSession(
    sessionId: string,
    productId: string,
    userId: string,
    strategy?: AssignSessionStrategy,
  ) {
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

    const result = await this.prisma.$transaction(async (tx) => {
      const lockedTransfer = await tx.transferItem.findFirst({
        where: {
          tag: { epc: { in: uniqueEpcs } },
          transfer: { status: { in: [TransferStatus.PENDING, TransferStatus.COMPLETED] } },
        },
        select: {
          tag: { select: { epc: true } },
          transfer: { select: { code: true, status: true } },
        },
      });

      if (lockedTransfer) {
        throw new BusinessException(
          `Phiên đã có thẻ nằm trong phiếu điều chuyển ${lockedTransfer.transfer.code} (${lockedTransfer.transfer.status}), không thể cập nhật lại sản phẩm gán.`,
          'SESSION_TRANSFER_LOCKED',
          HttpStatus.CONFLICT,
        );
      }

      const tagsInSession = await tx.tag.findMany({
        where: { epc: { in: uniqueEpcs }, deletedAt: null },
        select: { id: true, epc: true, productId: true },
      });

      const assignedTags = tagsInSession.filter((tag) => !!tag.productId);
      const unassignedTags = tagsInSession.filter((tag) => !tag.productId);
      const hasMixedAssignment = assignedTags.length > 0 && unassignedTags.length > 0;

      const effectiveStrategy: AssignSessionStrategy | null =
        strategy || (hasMixedAssignment ? null : (unassignedTags.length > 0 ? 'UNASSIGNED_ONLY' : 'OVERWRITE_ALL'));

      if (!effectiveStrategy) {
        throw new BusinessException(
          'Phiên có cả thẻ đã gán và chưa gán. Vui lòng chọn: chỉ gán thẻ chưa gán hoặc gán đè toàn bộ.',
          'ASSIGN_STRATEGY_REQUIRED',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (effectiveStrategy === 'UNASSIGNED_ONLY' && unassignedTags.length === 0) {
        throw new BusinessException(
          'Phiên này không còn thẻ chưa gán để thực hiện chế độ "chỉ gán thẻ chưa gán".',
          'NO_UNASSIGNED_TAGS',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (effectiveStrategy === 'OVERWRITE_ALL' && assignedTags.length > 0) {
        const hasDifferentCurrentProduct = assignedTags.some((tag) => tag.productId !== productId);
        if (!hasDifferentCurrentProduct) {
          throw new BusinessException(
            'Để đồng bộ toàn bộ thẻ, vui lòng chọn sản phẩm khác với sản phẩm đã gán hiện tại.',
            'SAME_PRODUCT_OVERWRITE_NOT_ALLOWED',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      const targetEpcs =
        effectiveStrategy === 'UNASSIGNED_ONLY'
          ? unassignedTags.map((tag) => tag.epc)
          : uniqueEpcs;

      if (targetEpcs.length === 0) {
        return {
          count: 0,
          strategy: effectiveStrategy,
          totalInSession: uniqueEpcs.length,
          assignedBefore: assignedTags.length,
          unassignedBefore: unassignedTags.length,
        };
      }

      const tagsToUpdate = await tx.tag.findMany({
        where: { epc: { in: targetEpcs }, deletedAt: null },
        select: { id: true },
      });
      const tagIds = tagsToUpdate.map((tag) => tag.id);

      const updateResult = await tx.tag.updateMany({
        where: { epc: { in: targetEpcs }, deletedAt: null },
        data: {
          productId: productId,
          status: TagStatus.IN_WORKSHOP,
          updatedById: userId,
        },
      });

      if (tagIds.length > 0) {
        const description =
          effectiveStrategy === 'UNASSIGNED_ONLY'
            ? `Gán sản phẩm cho thẻ chưa gán: ${product.name} (Phiên: ${session.name})`
            : `Gán đè toàn bộ thẻ sang sản phẩm: ${product.name} (Phiên: ${session.name})`;

        await tx.tagEvent.createMany({
          data: tagIds.map((tagId) => ({
            tagId,
            type: 'ASSIGNED',
            description,
            userId,
          })),
        });
      }

      return {
        count: updateResult.count,
        strategy: effectiveStrategy,
        totalInSession: uniqueEpcs.length,
        assignedBefore: assignedTags.length,
        unassignedBefore: unassignedTags.length,
      };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });

    await this.cacheManager.del('inventory:summary');

    return result;
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
      let acceptedOrderEpcs = new Set<string>();
      let overflowOrderEpcs = new Set<string>();
      
      if (order) {
        if (order.status === 'PENDING') {
          await tx.order.update({ where: { id: order.id }, data: { status: 'IN_PROGRESS' } });
          order.status = 'IN_PROGRESS';
        }
        
        // Group scanned tags by product and only accept up to order remaining quantity.
        // Over-scanned tags in inbound flow will be kept at workshop level.
        const scannedTagsByProduct = new Map<string, string[]>();
        for (const tag of scannedTagsInfo) {
          if (!tag.productId) continue;
          const current = scannedTagsByProduct.get(tag.productId) || [];
          current.push(tag.epc);
          scannedTagsByProduct.set(tag.productId, current);
        }

        let allCompleted = true;

        for (const item of order.items) {
          const remainingQty = Math.max(item.quantity - item.scannedQuantity, 0);
          const epcsForProduct = scannedTagsByProduct.get(item.productId) || [];
          const acceptedCount = Math.min(remainingQty, epcsForProduct.length);

          if (acceptedCount > 0) {
            const acceptedEpcs = epcsForProduct.splice(0, acceptedCount);
            acceptedEpcs.forEach((epc) => acceptedOrderEpcs.add(epc));

            const newScannedQty = item.scannedQuantity + acceptedCount;
            await tx.orderItem.update({
              where: { id: item.id },
              data: { scannedQuantity: newScannedQty }
            });
            if (newScannedQty < item.quantity) allCompleted = false;
          } else if (item.scannedQuantity < item.quantity) {
            allCompleted = false;
          }
        }

        overflowOrderEpcs = new Set(uniqueEpcs.filter((epc) => !acceptedOrderEpcs.has(epc)));

        if (allCompleted) {
          await tx.order.update({ where: { id: order.id }, data: { status: 'COMPLETED' } });
        }

        // Determine tag status destination
        if (order.type === 'OUTBOUND') {
          const destinationType = order.location?.type;

          if (destinationType === 'WORKSHOP') {
            tagsToUpdateStatus = TagStatus.IN_WORKSHOP;
            targetLocationId = order.locationId;
          } else if (
            destinationType === 'WAREHOUSE' ||
            destinationType === 'WORKSHOP_WAREHOUSE' ||
            destinationType === 'ADMIN'
          ) {
            tagsToUpdateStatus = TagStatus.IN_WAREHOUSE;
            targetLocationId = order.locationId;
          } else {
            // Khách hàng / điểm tiêu thụ => xem là đã xuất hoàn tất
            tagsToUpdateStatus = TagStatus.COMPLETED;
            targetLocationId = order.locationId;
          }
        } else if (order.type === 'INBOUND') {
          if (order.location?.type === 'WORKSHOP' && order.locationId) {
            // Inbound vào xưởng sẽ ưu tiên nhập thẳng vào kho xưởng (location con WORKSHOP_WAREHOUSE)
            const workshopWarehouse = await tx.location.findFirst({
              where: {
                parentId: order.locationId,
                type: 'WORKSHOP_WAREHOUSE',
                deletedAt: null,
              },
              select: { id: true },
            });

            if (workshopWarehouse) {
              tagsToUpdateStatus = TagStatus.IN_WAREHOUSE;
              targetLocationId = workshopWarehouse.id;
            } else {
              // Fallback cho dữ liệu cũ chưa có kho xưởng con
              tagsToUpdateStatus = TagStatus.IN_WORKSHOP;
              targetLocationId = order.locationId;
            }
          } else {
            tagsToUpdateStatus = TagStatus.IN_WAREHOUSE;
            targetLocationId = order.locationId;
          }
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
      if (order) {
        const acceptedOrderList = Array.from(acceptedOrderEpcs);
        const overflowOrderList = Array.from(overflowOrderEpcs);

        if (acceptedOrderList.length > 0) {
          await tx.tag.updateMany({
            where: { epc: { in: acceptedOrderList } },
            data: {
              location: dto.name,
              lastSeenAt: now,
              ...(tagsToUpdateStatus ? { status: tagsToUpdateStatus } : {}),
              ...(targetLocationId ? { locationId: targetLocationId } : {})
            }
          });
        }

        if (overflowOrderList.length > 0) {
          await tx.tag.updateMany({
            where: { epc: { in: overflowOrderList } },
            data: {
              location: dto.name,
              lastSeenAt: now,
            }
          });
        }
      } else {
        await tx.tag.updateMany({
          where: { epc: { in: uniqueEpcs } },
          data: {
            location: dto.name,
            lastSeenAt: now,
            ...(tagsToUpdateStatus ? { status: tagsToUpdateStatus } : {}),
            ...(targetLocationId ? { locationId: targetLocationId } : {})
          }
        });
      }

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

    await this.cacheManager.del('inventory:summary');

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
