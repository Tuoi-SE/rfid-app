import { Expose, Type } from 'class-transformer';
import { BaseEntity } from '../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';

export class CategoryEntity extends BaseEntity {
  name: string;
  description?: string | null;

  @Expose({ name: 'created_by' })
  @Type(() => UserEntity)
  createdBy?: UserEntity | null;

  @Expose({ name: 'updated_by' })
  @Type(() => UserEntity)
  updatedBy?: UserEntity | null;

  @Expose({ name: 'deleted_by' })
  @Type(() => UserEntity)
  deletedBy?: UserEntity | null;

  @Expose({ name: 'product_count' })
  get productCount(): number {
    return (this as any)._count?.products ?? 0;
  }

  constructor(partial: Partial<CategoryEntity>) {
    super(partial);
    Object.assign(this, partial);
  }
}
