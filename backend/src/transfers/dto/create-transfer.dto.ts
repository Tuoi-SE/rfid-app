import { IsArray, IsEnum, IsUUID, ArrayMinSize } from 'class-validator';
import { TransferType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransferDto {
  @ApiProperty({ enum: TransferType, example: 'ADMIN_TO_WORKSHOP', description: 'Loại điều chuyển' })
  @IsEnum(TransferType)
  type: TransferType;  // ADMIN_TO_WORKSHOP or WORKSHOP_TO_WAREHOUSE

  @ApiProperty({ example: '123e4567-...', description: 'ID Kho nguồn' })
  @IsUUID()
  sourceId: string;  // Location nguon (ADMIN hoac WORKSHOP)

  @ApiProperty({ example: '123e4567-...', description: 'ID Kho đích' })
  @IsUUID()
  destinationId: string;  // Location dich (WORKSHOP hoac WAREHOUSE)

  @ApiProperty({ type: [String], example: ['123e4567-...'], description: 'Danh sách ID Thẻ' })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  tagIds: string[];
}
