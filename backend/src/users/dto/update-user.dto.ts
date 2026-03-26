import { IsOptional, IsString, IsEnum, MinLength, MaxLength } from 'class-validator';
import { Role } from '.prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
