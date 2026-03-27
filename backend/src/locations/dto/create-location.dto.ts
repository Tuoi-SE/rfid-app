import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLocationDto {
  @ApiProperty({ example: 'WS-C', description: 'Mã định danh kho/xưởng' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Xưởng May C', description: 'Tên hiển thị' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'WORKSHOP', description: 'Loại hình (ADMIN/WAREHOUSE/WORKSHOP/CUSTOMER)', enum: ['ADMIN', 'WORKSHOP', 'WAREHOUSE', 'CUSTOMER'] })
  @IsEnum(['ADMIN', 'WORKSHOP', 'WAREHOUSE', 'CUSTOMER'])
  type: 'ADMIN' | 'WORKSHOP' | 'WAREHOUSE' | 'CUSTOMER';

  @ApiPropertyOptional({ example: 'KCN Vĩnh Lộc, HCM', description: 'Địa chỉ vật lý' })
  @IsString()
  @IsOptional()
  address?: string;
}
