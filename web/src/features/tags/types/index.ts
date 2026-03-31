export interface TagData {
  epc: string;
  name?: string;
  category?: string;
  status: string;
  location?: string;
  locationId?: string;
  lastSeenAt?: string;
  product?: {
    name: string;
    sku: string;
    category?: { name: string };
  };
}
