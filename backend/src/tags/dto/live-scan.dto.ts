import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';

export class LiveScanItemDto {
  @ApiProperty({ example: 'E200001B641401340910A381', description: 'Mã EPC thiết bị quét sóng đọc được' })
  @IsString()
  @IsNotEmpty()
  epc: string;

  @ApiProperty({ example: -55, description: 'Cường độ đo sóng' })
  @IsNumber()
  rssi: number;
}

export class LiveScanDto {
  @ApiProperty({ type: [LiveScanItemDto], description: 'Mảng danh sách các thẻ Live Scan' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LiveScanItemDto)
  scans: LiveScanItemDto[];
}
