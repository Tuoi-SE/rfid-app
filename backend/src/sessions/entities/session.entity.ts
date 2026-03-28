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
  name: string;
  startedAt: Date;
  endedAt?: Date | null;
  totalTags: number;
  userId?: string | null;
  orderId?: string | null;

  @Type(() => UserEntity)
  user?: UserEntity | null;

  @Type(() => OrderEntity)
  order?: OrderEntity | null;

  @Type(() => ScanEntity)
  scans?: ScanEntity[];

  totalScans?: number; // Added from count in service

  constructor(partial: Partial<SessionEntity>) {
    super(partial);
    Object.assign(this, partial);
  }
}
