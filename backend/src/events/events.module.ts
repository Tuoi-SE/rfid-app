import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventsGateway } from './events.gateway';
import { BatchScanService } from '../scanning/batch-scan.service';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
      }),
    }),
    InventoryModule,  // Required for BatchScanService -> InventoryService dependency
  ],
  providers: [EventsGateway, BatchScanService],
  exports: [EventsGateway, BatchScanService],
})
export class EventsModule {}
