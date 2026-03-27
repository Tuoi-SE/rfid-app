import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsIn...', description: 'Refresh Token hợp lệ' })
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}
