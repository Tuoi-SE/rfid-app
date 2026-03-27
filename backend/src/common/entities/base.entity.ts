import { Exclude, Expose } from 'class-transformer';

export class BaseEntity {
  id: string;

  @Expose({ name: 'created_at' })
  createdAt: Date;

  @Expose({ name: 'updated_at' })
  updatedAt: Date;

  @Exclude()
  deletedAt: Date | null;

  @Exclude()
  createdById: string | null;

  @Exclude()
  updatedById: string | null;

  @Exclude()
  deletedById: string | null;

  constructor(partial: Partial<BaseEntity>) {
    Object.assign(this, partial);
  }
}
