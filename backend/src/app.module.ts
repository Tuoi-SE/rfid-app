import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
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
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: ActivityLogInterceptor },
  ],
})
export class AppModule {}
