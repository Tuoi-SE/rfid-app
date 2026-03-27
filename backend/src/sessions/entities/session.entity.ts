import { Expose, Type } from 'class-transformer';
import { BaseEntity } from '../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { OrderEntity } from '../../orders/entities/order.entity';
import { TagEntity } from '../../tags/entities/tag.entity';

export class ScanEntity extends BaseEntity {
  sessionId: string;
  tagEpc: string;
  readerMac: string;
  rssi?: number | null;
  status: string;
  scannedAt: Date;

  @Type(() => TagEntity)
  tag?: TagEntity | null;

  constructor(partial: Partial<ScanEntity>) {
    super(partial);
    Object.assign(this, partial);
  }
}

export class SessionEntity extends BaseEntity {
  orderId: string;
  startTime: Date;
  endTime?: Date | null;
  status: string;
  totalScans: number;
  successScans: number;
  errorScans: number;
  missingItems?: any;

  @Type(() => OrderEntity)
  order?: OrderEntity | null;

  @Expose({ name: 'created_by' })
  @Type(() => UserEntity)
  createdBy?: UserEntity | null;

  @Expose({ name: 'updated_by' })
  @Type(() => UserEntity)
  updatedBy?: UserEntity | null;

  @Expose({ name: 'deleted_by' })
  @Type(() => UserEntity)
  deletedBy?: UserEntity | null;

  @Type(() => ScanEntity)
  scans?: ScanEntity[];

  constructor(partial: Partial<SessionEntity>) {
    super(partial);
    Object.assign(this, partial);
  }
}
