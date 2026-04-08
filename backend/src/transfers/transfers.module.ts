import { Module } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { TransfersController } from './transfers.controller';
import { TransferValidationService } from './transfer-validation.service';
import { TransferLocationService } from './transfer-location.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TransfersController],
  providers: [
    TransfersService,
    TransferValidationService,
    TransferLocationService,
  ],
  exports: [TransfersService],
})
export class TransfersModule {}
