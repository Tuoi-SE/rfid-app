import { Expose, Type } from 'class-transformer';
import { BaseEntity } from '../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { TagEntity } from '../../tags/entities/tag.entity';

export class LocationEntity extends BaseEntity {
  name: string;
  description?: string | null;

  @Expose({ name: 'tags_count' })
  get tagsCount(): number {
    return (this as any)._count?.tags ?? 0;
  }

  @Expose({ name: 'tags' })
  @Type(() => TagEntity)
  tags?: TagEntity[];

  @Expose({ name: 'created_by' })
  @Type(() => UserEntity)
  createdBy?: UserEntity | null;

  @Expose({ name: 'updated_by' })
  @Type(() => UserEntity)
  updatedBy?: UserEntity | null;

  children?: LocationEntity[];

  @Expose({ name: 'deleted_by' })
  @Type(() => UserEntity)
  deletedBy?: UserEntity | null;

  constructor(partial: Partial<LocationEntity>) {
    super(partial);
    Object.assign(this, partial);
  }
}
