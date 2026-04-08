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
  
  // New detail fields from backend/Sessions
  sessions?: {
    id: string;
    name: string;
    startedAt: string;
    endedAt?: string;
    totalTags: number;
    user?: { id: string; username: string };
    scans?: { id: string; tagEpc: string; scannedAt: string; rssi: number }[];
  }[];

  // Transport details (Mostly mocked for now as per design)
  transport?: {
    eta: string;
    status: string;
    roadmap: {
      source: string;
      intermediate?: string;
      destination: string;
    };
    timeline: {
      id: string;
      title: string;
      description: string;
      timestamp: string;
      actor: string;
      zone?: string;
    }[];
  };
}

export interface OrderItemForm {
  productId: string;
  quantity: number;
}
