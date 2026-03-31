import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EnvironmentValidator } from './common/config/env.validation';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CacheModule } from '@nestjs/cache-manager';
import { ioRedisStore } from '@tirke/node-cache-manager-ioredis';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TagsModule } from './tags/tags.module';
import { SessionsModule } from './sessions/sessions.module';
import { EventsModule } from './events/events.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { CaslModule } from './casl/casl.module';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { InventoryModule } from './inventory/inventory.module';
import { HealthController } from './health/health.controller';
import { ActivityLogInterceptor } from './activity-log/activity-log.interceptor';
import { OrdersModule } from './orders/orders.module';
import { LocationsModule } from './locations/locations.module';
import { TransfersModule } from './transfers/transfers.module';
import { LoggerConfigModule } from '@common/config/logger.config';

class AppModuleConfig {
  static async createCacheOptions(configService: ConfigService) {
    const redisHost = configService.get<string>('REDIS_HOST');

    // If Redis is not configured, use in-memory cache (works on free tier without Redis)
    if (!redisHost) {
      return { ttl: 60 * 1000 };
    }

    return {
      store: ioRedisStore({
        host: redisHost,
        port: configService.get<number>('REDIS_PORT', 6379),
        ttl: 60 * 1000,
      }),
    };
  }

  static createThrottlerOptions(config: ConfigService) {
    return [
      {
        ttl: config.get<number>('THROTTLE_TTL', 60000),
        limit: config.get<number>('THROTTLE_LIMIT', 100),
      },
    ];
  }
}

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true, validate: EnvironmentValidator.validate }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: AppModuleConfig.createCacheOptions,
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: AppModuleConfig.createThrottlerOptions,
    }),
    PrismaModule,
    CaslModule,
    ActivityLogModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    TagsModule,
    SessionsModule,
    EventsModule,
    DashboardModule,
    InventoryModule,
    OrdersModule,
    LocationsModule,
    TransfersModule,
    LoggerConfigModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: ActivityLogInterceptor },
  ],
})
export class AppModule {}
