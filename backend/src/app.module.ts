import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validate } from './common/config/env.validation';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from '@tirke/node-cache-manager-ioredis';
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

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true, validate }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          ttl: 60 * 1000, // 60 seconds default TTL
        }),
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ([
        {
          ttl: config.get<number>('THROTTLE_TTL', 60000),
          limit: config.get<number>('THROTTLE_LIMIT', 100),
        },
      ]),
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
