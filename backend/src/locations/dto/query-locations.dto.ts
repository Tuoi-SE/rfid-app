import { IsOptional, IsEnum, IsInt, Min, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryLocationsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['ADMIN', 'WORKSHOP', 'WAREHOUSE', 'CUSTOMER'])
  type?: string;
}
