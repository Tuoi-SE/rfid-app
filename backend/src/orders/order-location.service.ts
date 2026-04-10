import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { LocationType, TagStatus } from '@prisma/client';
import { getAuthorizedLocationIds } from '@common/helpers/location.helper';

export interface TagStatusResult {
  status: TagStatus;
  finalLocationId?: string;
}

@Injectable()
export class OrderLocationService {
  constructor(private prisma: PrismaService) {}

  async getManagerInboundAllowedLocationIds(locationId?: string): Promise<string[]> {
    const [ownedAndChildren, centralWarehouses] = await Promise.all([
      getAuthorizedLocationIds(this.prisma, locationId),
      this.prisma.location.findMany({
        where: { type: LocationType.WAREHOUSE, deletedAt: null },
        select: { id: true },
      }),
    ]);
    return Array.from(new Set([...ownedAndChildren, ...centralWarehouses.map((loc) => loc.id)]));
  }

  async determineTagStatusAndLocation(
    type: 'INBOUND' | 'OUTBOUND',
    locationId: string,
  ): Promise<TagStatusResult> {
    const dest = await this.prisma.location.findUnique({ where: { id: locationId } });

    if (type === 'OUTBOUND') {
      if (dest?.type === 'WORKSHOP') {
        return { status: TagStatus.IN_WORKSHOP };
      } else if (
        dest?.type === 'WAREHOUSE' ||
        dest?.type === 'WORKSHOP_WAREHOUSE' ||
        dest?.type === 'ADMIN'
      ) {
        return { status: TagStatus.IN_WAREHOUSE };
      }
      return { status: TagStatus.COMPLETED };
    } else {
      if (dest?.type === 'WORKSHOP') {
        const workshopWarehouse = await this.prisma.location.findFirst({
          where: { parentId: locationId, type: 'WORKSHOP_WAREHOUSE', deletedAt: null },
        });
        if (workshopWarehouse) {
          return { status: TagStatus.IN_WAREHOUSE, finalLocationId: workshopWarehouse.id };
        }
        return { status: TagStatus.IN_WORKSHOP };
      }
      return { status: TagStatus.IN_WAREHOUSE };
    }
  }
}
