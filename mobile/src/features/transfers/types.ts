export type TransferStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';
export type TransferType = 'ADMIN_TO_WORKSHOP' | 'WORKSHOP_TO_WAREHOUSE' | 'WAREHOUSE_TO_CUSTOMER';

export interface Location {
  id: string;
  name: string;
  code: string;
}

export interface Tag {
  id: string;
  epc: string;
  productId: string;
}

export interface TransferItem {
  id: string;
  transferId: string;
  tagId: string;
  scannedAt: string | null;
  tag?: Tag;
}

export interface TransferData {
  id: string;
  code: string;
  type: TransferType;
  status: TransferStatus;
  sourceId: string | null;
  destinationId: string;
  createdAt: string;
  updatedAt: string;
  source?: Location;
  destination: Location;
  items: TransferItem[];
}
