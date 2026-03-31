import { IsString, IsNotEmpty, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '.prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'nguyenvana', description: 'Tên định danh đăng nhập' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @ApiProperty({ example: 'Matkhau@1234', description: 'Mật khẩu bảo mật' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ enum: Role, example: Role.STAFF, description: 'Phân quyền hệ thống' })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ example: 'uuid', description: 'ID của cơ sở / kho / xưởng mà User này quản lý' })
  @IsOptional()
  @IsString()
  locationId?: string;
}
