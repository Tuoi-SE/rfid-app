import { Expose, Type } from 'class-transformer';
import { BaseEntity } from '../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { CategoryEntity } from '../../categories/entities/category.entity';

export class ProductEntity extends BaseEntity {
  name: string;
  sku: string;
  categoryId: string;

  @Type(() => CategoryEntity)
  category?: CategoryEntity | null;

  @Expose({ name: 'created_by' })
  @Type(() => UserEntity)
  createdBy?: UserEntity | null;

  @Expose({ name: 'updated_by' })
  @Type(() => UserEntity)
  updatedBy?: UserEntity | null;

  @Expose({ name: 'deleted_by' })
  @Type(() => UserEntity)
  deletedBy?: UserEntity | null;

  @Expose({ name: 'tag_count' })
  get tagCount(): number {
    return (this as any)._count?.tags ?? 0;
  }

  constructor(partial: Partial<ProductEntity>) {
    super(partial);
    Object.assign(this, partial);
  }
}
