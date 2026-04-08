import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class TransferLocationService {
  constructor(private prisma: PrismaService) {}

  async getAuthorizedLocationIds(locationId?: string): Promise<string[]> {
    if (!locationId) return [];
    const locs = await this.prisma.location.findMany({
      where: {
        OR: [{ id: locationId }, { parentId: locationId }],
        deletedAt: null,
      },
      select: { id: true },
    });
    return locs.map((l) => l.id);
  }
}
