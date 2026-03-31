export type LocationType = 'ADMIN' | 'WORKSHOP' | 'WORKSHOP_WAREHOUSE' | 'WAREHOUSE' | 'HOTEL' | 'RESORT' | 'SPA' | 'CUSTOMER';


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
  children?: LocationData[];
}

export interface LocationFormData {
  code: string;
  name: string;
  type: LocationType;
  address?: string;
}

export interface UpdateLocationData {
  name?: string;
  address?: string;
}
