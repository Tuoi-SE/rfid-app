import { Injectable, Scope } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { getAuthorizedLocationIds } from '@common/helpers/location.helper';

@Injectable({ scope: Scope.REQUEST })
export class TransferLocationService {
  constructor(private prisma: PrismaService) {}

  // D-10: Per-request cache — NestJS REQUEST scope creates a new instance per HTTP request,
  // so this is automatically cleared after each request completes.
  private authorizedLocationIdsCache?: string[];

  async getAuthorizedLocationIds(locationId?: string): Promise<string[]> {
    // D-10: Return cached value if already computed in this request
    if (this.authorizedLocationIdsCache !== undefined) {
      return this.authorizedLocationIdsCache;
    }

    const result = await getAuthorizedLocationIds(this.prisma, locationId);
    this.authorizedLocationIdsCache = result;
    return result;
  }
}
