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
  created_at?: string;
  createdAt?: string;
  deleted_at?: string | null;
  deletedAt?: string | null;
}

export interface UserFormData {
  username: string;
  password?: string;
  role: string | 'ADMIN' | 'WAREHOUSE_MANAGER' | 'STAFF';
  locationId?: string | null;
}
