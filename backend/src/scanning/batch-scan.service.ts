import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { InventoryService } from '../inventory/inventory.service';

interface EPCData {
  epc: string;
  rssi: number;
  timestamp: number;
}

export const MAX_BUFFER_SIZE = 500;
export const MAX_BUFFER_AGE = 5000; // ms

@Injectable()
export class BatchScanService implements OnModuleDestroy {
  private buffer: Map<string, EPCData> = new Map();
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private userId: string | null = null; // Captured from first addEpc or explicit flush call

  constructor(private inventoryService: InventoryService) {}

  async addEpc(epc: string, rssi: number = -60, userId?: string): Promise<{ flushed: boolean; bufferSize: number; bufferSizeBeforeFlush?: number }> {
    // D-07: Map prevents duplicate EPCs in same batch
    if (this.buffer.has(epc)) {
      return { flushed: false, bufferSize: this.buffer.size };
    }

    // Capture userId from first EPC in batch
    if (userId && !this.userId) {
      this.userId = userId;
    }

    // D-07: Store with timestamp for age-based flush
    this.buffer.set(epc, { epc, rssi, timestamp: Date.now() });

    // D-03, D-06: Start/reset flush timer on each add
    this.scheduleFlush();

    // D-05: Flush immediately if threshold reached
    if (this.buffer.size >= MAX_BUFFER_SIZE) {
      const flushedCount = this.buffer.size;
      await this.flush();
      return { flushed: true, bufferSize: 0, bufferSizeBeforeFlush: flushedCount };
    }

    return { flushed: false, bufferSize: this.buffer.size };
  }

  private scheduleFlush(): void {
    // Clear existing timer
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }
    // D-06: 5-second interval
    this.flushTimer = setTimeout(() => {
      this.flush();
    }, MAX_BUFFER_AGE);
  }

  async flush(userId?: string): Promise<{ processed: number }> {
    // Clear timer first
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    // Nothing to flush
    if (this.buffer.size === 0) {
      return { processed: 0 };
    }

    // Use explicit userId if provided, otherwise fall back to captured userId
    const effectiveUserId = userId || this.userId || 'system';

    // D-03: Convert buffer to array and process
    const epcs = Array.from(this.buffer.values()).map((e) => e.epc);
    const bufferSize = this.buffer.size;

    // D-04: Delegate to InventoryService.processBulkScan()
    await this.inventoryService.processBulkScan(epcs, effectiveUserId);

    // Clear buffer and userId after successful processing
    this.buffer.clear();
    this.userId = null;

    return { processed: bufferSize };
  }

  getBufferSize(): number {
    return this.buffer.size;
  }

  onModuleDestroy() {
    // Flush remaining buffer on shutdown
    if (this.buffer.size > 0) {
      this.flush();
    }
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }
  }
}
