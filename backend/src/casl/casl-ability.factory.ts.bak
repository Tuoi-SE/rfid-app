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

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: { id: string; role: Role }): AppAbility {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    switch (user.role) {
      case Role.ADMIN:
        can('manage', 'all');
        break;

      case Role.WAREHOUSE_MANAGER:
        // Read-only cho hầu hết tài nguyên
        can('read', 'Category');
        can('read', 'Product');
        can('read', 'Tag');
        can('read', 'Order');
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
