export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  scannedQuantity: number;
  product: { name: string; sku: string };
}

export interface Order {
  id: string;
  code: string;
  type: 'INBOUND' | 'OUTBOUND';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  progress?: number;
  createdById?: string;
  createdBy?: { id: string; username: string; role?: string };
  location?: { id: string; name: string; type: string };
}

export interface OrderItemForm {
  productId: string;
  quantity: number;
}
