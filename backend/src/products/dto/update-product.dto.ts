import { IsOptional, IsString, MaxLength, IsUUID } from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  sku?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
