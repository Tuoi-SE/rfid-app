import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class CreateLocationDto {
  @IsString()
  @IsNotEmpty()
  code: string; // e.g., "WS-C", "WH-HN-02"

  @IsString()
  @IsNotEmpty()
  name: string; // e.g., "Xưởng May C"

  @IsEnum(['ADMIN', 'WORKSHOP', 'WAREHOUSE', 'CUSTOMER'])
  type: 'ADMIN' | 'WORKSHOP' | 'WAREHOUSE' | 'CUSTOMER';

  @IsString()
  @IsOptional()
  address?: string;
}
