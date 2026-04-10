import { IsString, IsNotEmpty, IsEmail, MinLength } from 'class-validator';
export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string; // 6-digit numeric

  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  newPassword: string;
}
