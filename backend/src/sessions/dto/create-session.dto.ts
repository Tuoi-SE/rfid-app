import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ example: 'E200001B641401340910A381', description: 'Mã EPC từ máy quét' })
  @IsString()
  @IsNotEmpty()
  epc: string;

  @ApiProperty({ example: -55, description: 'Cường độ sóng (RSSI)' })
  @IsNumber()
  rssi: number;

  @ApiProperty({ example: '2023-11-20T10:00:00Z', description: 'Thời gian máy nhận tín hiệu' })
  @IsDateString()
  time: string;
}

export class CreateSessionDto {
  @ApiProperty({ example: 'Ca Sáng Trưởng Ca B', description: 'Tên gợi nhớ phiên quét' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-...', description: 'ID Phiếu Xuất/Nhập (Nếu chạy theo lệnh)' })
  @IsString()
  @IsOptional()
  orderId?: string;

  @ApiPropertyOptional({ type: [ScanItemDto], description: 'Danh sách thẻ scan được' })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ScanItemDto)
  scans?: ScanItemDto[];
}
