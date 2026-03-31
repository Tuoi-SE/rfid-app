export type LocationType = 'ADMIN' | 'WORKSHOP' | 'WAREHOUSE' | 'HOTEL' | 'RESORT' | 'SPA' | 'CUSTOMER';

export interface LocationOperator {
  id: string;
  username: string;
}

export interface LocationData {
  id: string;
  code: string;
  name: string;
  type: LocationType;
  address: string | null;
  tags_count: number;
  createdAt: string;
  updatedAt: string;
  created_by?: LocationOperator | null;
}

export interface LocationFormData {
  code: string;
  name: string;
  type: LocationType;
  address?: string;
}
