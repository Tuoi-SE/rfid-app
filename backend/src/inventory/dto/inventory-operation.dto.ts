import { IsArray, IsString, IsEnum, IsOptional, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum InventoryAction {
  CHECK_IN = 'CHECK_IN',
  CHECK_OUT = 'CHECK_OUT',
}

export class InventoryOperationDto {
  @ApiProperty({ enum: InventoryAction, description: 'Loại thao tác: nhập kho hoặc xuất kho' })
  @IsEnum(InventoryAction)
  action: InventoryAction;

  @ApiProperty({ type: [String], description: 'Danh sách tag IDs hoặc EPCs' })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  tagIdentifiers: string[];

  @ApiProperty({ required: false, description: 'Ghi chú cho thao tác' })
  @IsOptional()
  @IsString()
  note?: string;
}
