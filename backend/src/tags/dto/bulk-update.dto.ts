import { IsArray, IsString, IsUUID, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignTagsDto {
  @ApiProperty({ type: [String], example: ['123e4567-e89b-12d3-a456-426614174000'], description: 'Danh sách ID của Thẻ (Tag)' })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  tagIds: string[];

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174444', description: 'ID Sản phẩm cần gán' })
  @IsUUID()
  productId: string;
}
