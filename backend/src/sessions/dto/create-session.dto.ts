import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ScanItemDto {
  @IsString()
  @IsNotEmpty()
  epc: string;

  @IsNumber()
  rssi: number;

  @IsDateString()
  time: string;
}

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  orderId?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ScanItemDto)
  scans?: ScanItemDto[];
}
