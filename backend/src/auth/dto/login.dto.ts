import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin', description: 'Tên đăng nhập' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: '123456', description: 'Mật khẩu' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'WEB', description: 'Loại thiết bị đăng nhập (WEB/MOBILE)', required: false })
  @IsOptional()
  @IsString()
  deviceType?: string;
}
