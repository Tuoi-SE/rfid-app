import { IsOptional, IsInt, Min, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { Role } from '.prisma/client';

export class QueryUsersDto {
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
  @IsEnum(Role)
  role?: Role;
}
