import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';

export class LiveScanItemDto {
  @IsString()
  @IsNotEmpty()
  epc: string;

  @IsNumber()
  rssi: number;
}

export class LiveScanDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LiveScanItemDto)
  scans: LiveScanItemDto[];
}
