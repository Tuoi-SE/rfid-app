import { Expose, Type } from 'class-transformer';
import { BaseEntity } from '../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { ProductEntity } from '../../products/entities/product.entity';
import { TagStatus } from '.prisma/client';

export class TagEntity extends BaseEntity {
  epc: string;
  productId?: string | null;
  status: TagStatus;

  @Type(() => ProductEntity)
  product?: ProductEntity | null;

  @Expose({ name: 'created_by' })
  @Type(() => UserEntity)
  createdBy?: UserEntity | null;

  @Expose({ name: 'updated_by' })
  @Type(() => UserEntity)
  updatedBy?: UserEntity | null;

  @Expose({ name: 'deleted_by' })
  @Type(() => UserEntity)
  deletedBy?: UserEntity | null;

  constructor(partial: Partial<TagEntity>) {
    super(partial);
    Object.assign(this, partial);
  }
}
