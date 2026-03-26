import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
  InferSubjects,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { Role } from '.prisma/client';

type Actions = 'manage' | 'create' | 'read' | 'update' | 'delete';
type Subjects =
  | 'User'
  | 'Category'
  | 'Product'
  | 'Tag'
  | 'Session'
  | 'Scan'
  | 'ActivityLog'
  | 'Dashboard'
  | 'all';

export type AppAbility = MongoAbility<[Actions, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: { id: string; role: Role }): AppAbility {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    if (user.role === Role.ADMIN) {
      can('manage', 'all');
    } else {
      // WAREHOUSE_MANAGER permissions
      can('read', 'Category');
      can('read', 'Product');

      can('read', 'Tag');
      can('create', 'Tag');
      can('update', 'Tag');

      can('manage', 'Scan');
      can('manage', 'Session');

      can('read', 'ActivityLog');

      cannot('manage', 'User');
      cannot('manage', 'Dashboard');
      cannot('create', 'Category');
      cannot('update', 'Category');
      cannot('delete', 'Category');
      cannot('create', 'Product');
      cannot('update', 'Product');
      cannot('delete', 'Product');
      cannot('delete', 'Tag');
    }

    return build();
  }
}
