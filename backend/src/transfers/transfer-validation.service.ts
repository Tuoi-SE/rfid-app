import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { TransferStatus, TagStatus } from '@prisma/client';
import { TAG_EVENT_TYPES } from '@common/constants/error-codes';

interface TagValidationError {
  tagId: string;
  epc?: string;
  reason:
    | 'TAG_NOT_FOUND'
    | 'TAG_IN_PENDING_TRANSFER'
    | 'TAG_NOT_AT_SOURCE'
    | 'TAG_ALREADY_COMPLETED_ROUTE';
  message: string;
  currentLocationId?: string | null;
  pendingTransferId?: string;
  pendingTransferCode?: string;
  completedTransferId?: string;
  completedTransferCode?: string;
}

@Injectable()
export class TransferValidationService {
  constructor(private prisma: PrismaService) {}

  buildTransferTagValidationError(
    blockedTags: TagValidationError[],
    acceptedTagCount: number,
    totalTagCount: number,
  ) {
    return new BadRequestException({
      success: false,
      message: `Có ${blockedTags.length}/${totalTagCount} tag không hợp lệ để tạo phiếu điều chuyển.`,
      error: {
        code: 'TRANSFER_TAG_VALIDATION_FAILED',
        details: {
          blockedTags,
          acceptedTagCount,
          totalTagCount,
        },
      },
    });
  }

  async validateTagsForCreateTransfer(
    tagIds: string[],
    dto: CreateTransferDto,
    user: { id: string; role: string },
  ): Promise<{ acceptedTagIds: string[]; tagsToRecall: Array<{ id: string; epc: string; fromLocationId: string }> }> {
    const uniqueTagIds = Array.from(new Set(tagIds));
    if (uniqueTagIds.length === 0) {
      throw new BadRequestException('Danh sách tag trống');
    }

    const tags = await this.prisma.tag.findMany({
      where: { id: { in: uniqueTagIds } },
      select: { id: true, epc: true, locationId: true },
    });
    const tagById = new Map(tags.map((tag) => [tag.id, tag]));

    const pendingItems = await this.prisma.transferItem.findMany({
      where: {
        tagId: { in: uniqueTagIds },
        transfer: { status: TransferStatus.PENDING },
      },
      select: {
        tagId: true,
        transfer: { select: { id: true, code: true } },
      },
    });
    const pendingByTagId = new Map(
      pendingItems.map((item) => [item.tagId, item.transfer]),
    );

    const completedItems = await this.prisma.transferItem.findMany({
      where: {
        tagId: { in: uniqueTagIds },
        transfer: { status: TransferStatus.COMPLETED },
      },
      orderBy: [{ transfer: { completedAt: 'desc' } }, { createdAt: 'desc' }],
      select: {
        tagId: true,
        transfer: {
          select: { id: true, code: true, type: true, sourceId: true, destinationId: true },
        },
      },
    });
    const latestCompletedByTagId = new Map<
      string,
      (typeof completedItems)[number]['transfer']
    >();
    completedItems.forEach((item) => {
      if (!latestCompletedByTagId.has(item.tagId)) {
        latestCompletedByTagId.set(item.tagId, item.transfer);
      }
    });

    const blockedTags: TagValidationError[] = [];
    const acceptedTagIds: string[] = [];
    const tagsToRecall: Array<{ id: string; epc: string; fromLocationId: string }> = [];

    for (const tagId of uniqueTagIds) {
      const tag = tagById.get(tagId);
      if (!tag) {
        blockedTags.push({
          tagId,
          reason: 'TAG_NOT_FOUND',
          message: 'Tag không tồn tại trong hệ thống.',
        });
        continue;
      }

      const pendingTransfer = pendingByTagId.get(tagId);
      if (pendingTransfer) {
        blockedTags.push({
          tagId,
          epc: tag.epc,
          reason: 'TAG_IN_PENDING_TRANSFER',
          message: 'Tag đang nằm trong phiếu điều chuyển PENDING khác.',
          pendingTransferId: pendingTransfer.id,
          pendingTransferCode: pendingTransfer.code,
        });
        continue;
      }

      const latestCompleted = latestCompletedByTagId.get(tagId);
      const alreadyCompletedCurrentRoute =
        !!latestCompleted &&
        latestCompleted.type === dto.type &&
        latestCompleted.sourceId === dto.sourceId &&
        latestCompleted.destinationId === dto.destinationId &&
        tag.locationId === dto.destinationId;

      if (alreadyCompletedCurrentRoute) {
        blockedTags.push({
          tagId,
          epc: tag.epc,
          reason: 'TAG_ALREADY_COMPLETED_ROUTE',
          message: 'Tag đã hoàn tất điều chuyển theo đúng tuyến này trước đó.',
          completedTransferId: latestCompleted.id,
          completedTransferCode: latestCompleted.code,
          currentLocationId: tag.locationId,
        });
        continue;
      }

      const allowUnknownSourceForAdminFlow =
        dto.type === 'ADMIN_TO_WORKSHOP' && !tag.locationId;

      if (tag.locationId !== dto.sourceId && !allowUnknownSourceForAdminFlow) {
        if (user.role === 'SUPER_ADMIN') {
          tagsToRecall.push({
            id: tagId,
            epc: tag.epc,
            fromLocationId: tag.locationId || 'UNKNOWN',
          });
          acceptedTagIds.push(tagId);
          continue;
        }

        blockedTags.push({
          tagId,
          epc: tag.epc,
          reason: 'TAG_NOT_AT_SOURCE',
          message: 'Tag không nằm tại kho nguồn hiện tại nên không thể tạo phiếu.',
          currentLocationId: tag.locationId,
        });
        continue;
      }

      acceptedTagIds.push(tagId);
    }

    if (blockedTags.length > 0) {
      throw this.buildTransferTagValidationError(
        blockedTags,
        acceptedTagIds.length,
        uniqueTagIds.length,
      );
    }

    // Auto-recall: batch update tags about source + ghi audit trail
    if (tagsToRecall.length > 0) {
      await this.prisma.tag.updateMany({
        where: { id: { in: tagsToRecall.map((t) => t.id) } },
        data: {
          locationId: dto.sourceId,
          status: TagStatus.UNASSIGNED,
        },
      });

      // Ghi TagEvent cho mỗi tag được recall
      await this.prisma.tagEvent.createMany({
        data: tagsToRecall.map((t) => ({
          tagId: t.id,
          type: TAG_EVENT_TYPES.RECALLED,
          location: `${t.fromLocationId} → ${dto.sourceId}`,
          description: `SUPER_ADMIN thu hồi tag ${t.epc} để điều chuyển lại`,
          userId: user.id,
        })),
      });
    }

    return { acceptedTagIds, tagsToRecall };
  }
}
