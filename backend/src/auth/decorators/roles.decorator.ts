import { SetMetadata } from '@nestjs/common';
import { Role } from '.prisma/client';

export class RolesDecorator {
  static readonly ROLES_KEY = 'roles';

  static allow(...roles: Role[]) {
    return SetMetadata(RolesDecorator.ROLES_KEY, roles);
  }
}
