import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { getAuthorizedLocationIds } from '@common/helpers/location.helper';

@Injectable()
export class TransferLocationService {
  constructor(private prisma: PrismaService) {}

  async getAuthorizedLocationIds(locationId?: string): Promise<string[]> {
    return getAuthorizedLocationIds(this.prisma, locationId);
  }
}
