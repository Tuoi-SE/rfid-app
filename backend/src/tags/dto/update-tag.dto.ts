import { IsOptional, IsString, IsUUID, IsEnum } from 'class-validator';
import { TagStatus } from '.prisma/client';

export class UpdateTagDto {
  @IsOptional()
  @IsUUID()
  productId?: string | null;

  @IsOptional()
  @IsEnum(TagStatus)
  status?: TagStatus;

  @IsOptional()
  @IsUUID()
  locationId?: string | null;
}
