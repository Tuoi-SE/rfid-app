import { IsOptional, IsEnum, IsUUID, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { TransferStatus, TransferType } from '.prisma/client';

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
  @IsEnum(TransferStatus)
  status?: TransferStatus;

  @IsOptional()
  @IsEnum(TransferType)
  type?: TransferType;

  @IsOptional()
  @IsUUID()
  sourceId?: string;

  @IsOptional()
  @IsUUID()
  destinationId?: string;
}
