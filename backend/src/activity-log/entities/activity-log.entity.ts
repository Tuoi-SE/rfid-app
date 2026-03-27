import { Expose, Type } from 'class-transformer';
import { BaseEntity } from '../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';

export class ActivityLogEntity extends BaseEntity {
  userId: string;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: any;
  ipAddress?: string | null;

  @Type(() => UserEntity)
  user?: UserEntity | null;

  constructor(partial: Partial<ActivityLogEntity>) {
    super(partial);
    Object.assign(this, partial);
  }
}
