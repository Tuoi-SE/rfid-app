import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@riotex.vn', description: 'Email hoặc tên đăng nhập' })
  @IsString()
  @IsNotEmpty()
  loginKey: string;  // Renamed from 'username'

  @ApiProperty({ example: 'Matkhau@1234', description: 'Mật khẩu' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({ example: 'WEB', description: 'Loại thiết bị (WEB/MOBILE)', required: false })
  @IsOptional()
  @IsString()
  deviceType?: string;
}
