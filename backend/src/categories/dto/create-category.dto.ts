import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Thiết bị IT', description: 'Tên danh mục' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Dành cho linh kiện máy tính, màn hình...', description: 'Mô tả chi tiết' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
