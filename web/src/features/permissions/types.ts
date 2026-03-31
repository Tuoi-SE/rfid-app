export type RoleKey = 'ADMIN' | 'WAREHOUSE_MANAGER' | 'STAFF';

export type PermissionAction = 'READ' | 'CREATE' | 'UPDATE' | 'DELETE' | 'MANAGE';

export interface PermissionRow {
  id: string;
  module: string;
  feature: string;
  route: string;
  note?: string;
  roles: Record<RoleKey, PermissionAction[]>;
}

