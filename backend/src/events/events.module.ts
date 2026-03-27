import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventsGateway } from './events.gateway';
import { ScanningModule } from '../scanning/scanning.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
      }),
    }),
    ScanningModule,  // Required for BatchScanService (D-09)
  ],
  providers: [EventsGateway],
  exports: [EventsGateway],  // EventsModule no longer exports BatchScanService (D-09)
})
export class EventsModule {}
