import { IsOptional, IsInt, Min, IsString, IsUUID, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { TagStatus } from '.prisma/client';

export class QueryTagsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsEnum(TagStatus)
  status?: TagStatus;

  @IsOptional()
  @IsString()
  unassigned?: string; // 'true' to get tags without products
}
