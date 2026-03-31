export interface User {
  id: string;
  username: string;
  role: 'ADMIN' | 'WAREHOUSE_MANAGER' | 'STAFF';
  locationId?: string | null;
  location?: {
    id: string;
    code: string;
    name: string;
    type: string;
  } | null;
  createdAt: string;
}

export interface UserFormData {
  username: string;
  password?: string;
  role: string | 'ADMIN' | 'WAREHOUSE_MANAGER' | 'STAFF';
  locationId?: string | null;
}
