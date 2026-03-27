import { Module } from '@nestjs/common';
import { BatchScanService } from './batch-scan.service';
import { InventoryModule } from '../inventory/inventory.module';

/**
 * ScanningModule owns BatchScanService and processBulkScan integration.
 *
 * Dependency flow:
 * ScanningModule ──imports──► InventoryModule
 *       │
 *       └── BatchScanService calls InventoryService.processBulkScan()
 *
 * This breaks the circular dependency:
 * - EventsModule imports ScanningModule (not InventoryModule)
 * - InventoryModule no longer imports EventsModule
 * - InventoryService uses EventEmitter2 instead of EventsGateway
 */
@Module({
  imports: [InventoryModule],  // For BatchScanService -> InventoryService.processBulkScan()
  providers: [BatchScanService],
  exports: [BatchScanService],
})
export class ScanningModule {}
