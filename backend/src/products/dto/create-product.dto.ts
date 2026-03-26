import { IsString, IsOptional, MaxLength, IsUUID } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsString()
  @MaxLength(50)
  sku: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsUUID()
  categoryId: string;
}
