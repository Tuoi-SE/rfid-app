import { Expose, Type } from 'class-transformer';
import { BaseEntity } from '../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { ProductEntity } from '../../products/entities/product.entity';
import { OrderType, OrderStatus } from '.prisma/client';

export class OrderItemEntity {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  scannedQuantity: number;

  @Type(() => ProductEntity)
  product?: ProductEntity | null;

  constructor(partial: Partial<OrderItemEntity>) {
    Object.assign(this, partial);
  }
}

export class OrderEntity extends BaseEntity {
  code: string;
  type: OrderType;
  status: OrderStatus;
  progress?: number;

  @Type(() => OrderItemEntity)
  items?: OrderItemEntity[];

  @Expose({ name: 'created_by' })
  @Type(() => UserEntity)
  createdBy?: UserEntity | null;

  @Expose({ name: 'updated_by' })
  @Type(() => UserEntity)
  updatedBy?: UserEntity | null;

  @Expose({ name: 'deleted_by' })
  @Type(() => UserEntity)
  deletedBy?: UserEntity | null;

  constructor(partial: Partial<OrderEntity>) {
    super(partial);
    Object.assign(this, partial);
  }
}
