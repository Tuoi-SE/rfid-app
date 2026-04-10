import { IsString, IsNotEmpty, MinLength, IsOptional, IsEnum, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '.prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'nguyenvana', description: 'Tên định danh đăng nhập' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @ApiProperty({ example: 'nguyenvana@riotex.vn', description: 'Email của người dùng (bắt buộc)' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ example: 'Matkhau@1234', description: 'Mật khẩu (nếu không cung cấp, hệ thống sẽ tạo mật khẩu tạm thời)' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ enum: Role, example: Role.STAFF, description: 'Phân quyền hệ thống' })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ example: 'uuid', description: 'ID của cơ sở / kho / xưởng mà User này quản lý' })
  @IsOptional()
  @IsString()
  locationId?: string;
}
