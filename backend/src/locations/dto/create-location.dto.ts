import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LocationType } from '.prisma/client';

export class CreateLocationDto {
  @ApiProperty({ example: 'WS-C', description: 'Mã định danh kho/xưởng' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Xưởng May C', description: 'Tên hiển thị' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'WORKSHOP', description: 'Loại hình (ADMIN/WAREHOUSE/WORKSHOP/WORKSHOP_WAREHOUSE/HOTEL/SPA/RESORT/CUSTOMER)', enum: LocationType })
  @IsEnum(LocationType)
  type: LocationType;

  @ApiPropertyOptional({ example: 'KCN Vĩnh Lộc, HCM', description: 'Địa chỉ vật lý' })
  @IsString()
  @IsOptional()
  address?: string;
}
