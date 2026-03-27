import { Controller, Get } from '@nestjs/common';
import { Cache } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ResponseMessage } from '@common/decorators/response-message.decorator';

@Controller('api/health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private cacheManager: Cache,
    private configService: ConfigService,
  ) {}

  @Get()
  @ResponseMessage('Kiểm tra sức khỏe hệ thống thành công')
  async check() {
    const redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
    const redisPort = this.configService.get<number>('REDIS_PORT', 6379);

    let redisStatus = 'degraded';
    try {
      await this.cacheManager.get('__health_check__');
      redisStatus = 'healthy';
    } catch {
      redisStatus = 'degraded';
    }

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        database: 'connected',
        redis: redisStatus,
        redisHost,
        redisPort,
        timestamp: new Date().toISOString()
      };
    } catch {
      return {
        status: 'error',
        database: 'disconnected',
        redis: redisStatus,
        redisHost,
        redisPort,
        timestamp: new Date().toISOString()
      };
    }
  }
}
