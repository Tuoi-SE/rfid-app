import { Exclude, Expose, Type } from 'class-transformer';
import { BaseEntity } from '../../common/entities/base.entity';
import { Role } from '.prisma/client';

class AuditUserEntity {
  id: string;
  username: string;

  constructor(partial: Partial<AuditUserEntity>) {
    Object.assign(this, partial);
  }
}

export class UserEntity extends BaseEntity {
  username: string;
  email?: string;
  role: Role;

  @Exclude()
  password?: string;

  @Expose({ name: 'created_by' })
  @Type(() => AuditUserEntity)
  createdBy?: AuditUserEntity | null;

  @Expose({ name: 'updated_by' })
  @Type(() => AuditUserEntity)
  updatedBy?: AuditUserEntity | null;

  @Expose({ name: 'deleted_by' })
  @Type(() => AuditUserEntity)
  deletedBy?: AuditUserEntity | null;

  // @ts-ignore
  @Expose({ name: 'deleted_at' })
  deletedAt: Date | null = null;

  constructor(partial: Partial<UserEntity>) {
    super(partial);
    Object.assign(this, partial);
  }
}
