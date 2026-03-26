import { IsArray, IsEnum, IsUUID, ArrayMinSize } from 'class-validator';
import { TransferType } from '@prisma/client';

export class CreateTransferDto {
  @IsEnum(TransferType)
  type: TransferType;  // ADMIN_TO_WORKSHOP or WORKSHOP_TO_WAREHOUSE

  @IsUUID()
  sourceId: string;  // Location nguon (ADMIN hoac WORKSHOP)

  @IsUUID()
  destinationId: string;  // Location dich (WORKSHOP hoac WAREHOUSE)

  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  tagIds: string[];
}
