import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '.prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: ConfigService) {
    const databaseUrl = config.get('DATABASE_URL');
    const poolSize = PrismaService.parsePoolSize(databaseUrl);

    const adapter = new PrismaPg({
      connectionString: databaseUrl,
      max: poolSize,                          // POOL-01: 20 connections default
      idleTimeoutMillis: 30_000,             // 30 seconds idle before closing
      connectionTimeoutMillis: 5_000,        // 5 seconds to acquire connection
    });
    super({ adapter });
  }

  private static parsePoolSize(databaseUrl: string): number {
    try {
      const url = new URL(databaseUrl);
      const connectionLimit = url.searchParams.get('connection_limit');
      if (connectionLimit) {
        const parsed = parseInt(connectionLimit, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {
      // Invalid URL, fall through to default
    }
    return 20; // POOL-01 default
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
