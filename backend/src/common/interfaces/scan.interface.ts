/**
 * Shared EPC and Scan types for scanning module.
 * Used by BatchScanService, EventsGateway, and InventoryService.
 */

/**
 * EPC data stored in batch scan buffer
 */
export interface EPCData {
  epc: string;
  rssi: number;
  timestamp: number;
}

/**
 * Scan payload received from WebSocket client
 */
export interface ScanPayload {
  epc: string;
  rssi: number;
}

/**
 * Enriched scan result returned to WebSocket clients
 */
export interface EPCScanResult {
  tagId: string;      // System UUID
  epc: string;        // Raw RFID code
  rssi: number;
  status: string;
  product: {
    id: string;
    name: string;
    sku: string;
    category?: { id: string; name: string };
  } | null;
  isNew: boolean;
}

/**
 * Event name for tags updated notification
 * Emitted by InventoryService via EventEmitter2
 * Listened by EventsGateway for WebSocket broadcast
 */
export const TAGS_UPDATED_EVENT = 'tags:updated';
