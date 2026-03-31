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
  | 'all';

export type AppAbility = MongoAbility<[Actions, Subjects]>;

const normalizeRole = (role: Role | string): Role | null => {
  const value = String(role || '').trim().toUpperCase();

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
      case Role.ADMIN:
        can('manage', 'all');
        break;

      case Role.WAREHOUSE_MANAGER:
        // Manager thao tác phiếu kho của chính mình (chi tiết ownership check ở service layer)
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

        // Session: được tạo phiên quét
        can('read', 'Session');
        can('create', 'Session');

        // Scan: full quyền quét
        can('manage', 'Scan');
        break;

      case Role.STAFF:
        // Chỉ đọc
        can('read', 'Category');
        can('read', 'Product');
        can('read', 'Tag');
        can('read', 'Order');
        can('create', 'Order');

        can('read', 'Location');
        can('read', 'Inventory');
        can('read', 'ActivityLog');

        // Session & Scan: được tạo / quét
        can('read', 'Session');
        can('create', 'Session');
        can('read', 'Scan');
        can('create', 'Scan');
        break;
    }

    return build();
  }
}
