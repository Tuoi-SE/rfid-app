import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';

@Module({
  imports: [],  // REMOVED: EventsModule - no longer needed (D-10)
  providers: [InventoryService],
  controllers: [InventoryController],
})
export class InventoryModule {}
