import { IsOptional, IsEnum, IsUUID, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryTransfersDto {
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
  @IsEnum(['PENDING', 'COMPLETED', 'CANCELLED'])
  status?: string;

  @IsOptional()
  @IsEnum(['ADMIN_TO_WORKSHOP'])
  type?: string;

  @IsOptional()
  @IsUUID()
  sourceId?: string;

  @IsOptional()
  @IsUUID()
  destinationId?: string;
}
