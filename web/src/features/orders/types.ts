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
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  userId: string;
  user: { username: string };
  createdAt: string;
  items: OrderItem[];
}

export interface OrderItemForm {
  productId: string;
  quantity: number;
}
