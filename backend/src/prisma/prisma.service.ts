import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '.prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { softDeleteExtension } from './soft-delete.extension';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: ConfigService) {
    const databaseUrl = config.get('DATABASE_URL');
    const poolSize = PrismaService.parsePoolSize(databaseUrl);

    const adapter = new PrismaPg({
      connectionString: databaseUrl,
      max: Math.min(poolSize, 10),            
      idleTimeoutMillis: 30_000,             
      connectionTimeoutMillis: 30_000,       
      ssl: { rejectUnauthorized: false },    // Cho phép chứng chỉ tự ký (cần thiết cho Supabase trên cloud)
    });
    super({ adapter });

    // Apply soft-delete extension — auto filter records có deletedAt != null
    const extended = this.$extends(softDeleteExtension);
    Object.assign(this, extended);
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
