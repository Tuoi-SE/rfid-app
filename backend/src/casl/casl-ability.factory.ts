import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { Role } from '.prisma/client';

export type Actions = 'manage' | 'create' | 'read' | 'update' | 'delete';
export type Subjects =
  | 'User'
  | 'Category'
  | 'Product'
  | 'Tag'
  | 'Order'
  | 'Session'
  | 'Scan'
  | 'Location'
  | 'Inventory'
  | 'ActivityLog'
  | 'Dashboard'
  | 'Transfer'
  | 'all';

export type AppAbility = MongoAbility<[Actions, Subjects]>;

const normalizeRole = (role: Role | string): Role | null => {
  const value = String(role || '').trim().toUpperCase();

  if (value === Role.SUPER_ADMIN || value === 'SUPERADMIN' || value === 'SUPER_ADMIN') {
    return Role.SUPER_ADMIN;
  }
  if (value === Role.ADMIN) return Role.ADMIN;
  if (value === Role.STAFF) return Role.STAFF;
  if (value === Role.WAREHOUSE_MANAGER || value === 'MANAGER' || value === 'WAREHOUSEMANAGER') {
    return Role.WAREHOUSE_MANAGER;
  }

  return null;
};

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: { id: string; role: Role | string }): AppAbility {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);
    const role = normalizeRole(user.role);

    switch (role) {
      case Role.SUPER_ADMIN:
        can('manage', 'all');
        break;

      case Role.ADMIN:
        // Business CRUD — KHÔNG có Dashboard, User, ActivityLog
        can('manage', 'Category');
        can('manage', 'Product');
        can('manage', 'Tag');
        can('manage', 'Order');
        can('manage', 'Session');
        can('manage', 'Scan');
        can('manage', 'Location');
        can('manage', 'Inventory');
        can('read', 'Transfer');
        can('create', 'Transfer');
        can('update', 'Transfer');
        can('delete', 'Transfer');
        break;

      case Role.WAREHOUSE_MANAGER:
        can('read', 'Category');
        can('read', 'Product');
        can('read', 'Tag');
        can('read', 'Order');
        can('create', 'Order');
        can('update', 'Order');
        can('delete', 'Order');

        can('read', 'Location');
        can('read', 'Inventory');
        can('read', 'ActivityLog');

        can('read', 'Session');
        can('create', 'Session');

        can('manage', 'Scan');
        break;

      case Role.STAFF:
        can('read', 'Category');
        can('read', 'Product');
        can('read', 'Tag');
        can('read', 'Order');
        can('create', 'Order');

        can('read', 'Location');
        can('read', 'Inventory');
        can('read', 'ActivityLog');

        can('read', 'Session');
        can('create', 'Session');
        can('read', 'Scan');
        can('create', 'Scan');
        break;
    }

    return build();
  }
}

