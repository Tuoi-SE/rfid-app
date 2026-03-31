export type TransferType = 'ADMIN_TO_WORKSHOP' | 'WORKSHOP_TO_WAREHOUSE' | 'WAREHOUSE_TO_CUSTOMER';
export type TransferStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface TransferLocation {
  id: string;
  name: string;
  type: string;
}

export interface TransferItem {
  id: string;
  tagId: string;
  condition: string | null;
  scannedAt: string | null;
  tag?: any; // Simplified for now
}

export interface TransferData {
  id: string;
  code: string;
  type: TransferType;
  status: TransferStatus;
  
  sourceId: string;
  source?: TransferLocation;
  
  destinationId: string;
  destination?: TransferLocation;
  
  createdById: string;
  createdBy?: { id: string; username: string; role?: string };
  
  items: TransferItem[];
  
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}
