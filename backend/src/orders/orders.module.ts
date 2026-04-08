import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrderValidationService } from './order-validation.service';
import { OrderLocationService } from './order-location.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    OrderValidationService,
    OrderLocationService,
  ],
  exports: [OrdersService],
})
export class OrdersModule {}
