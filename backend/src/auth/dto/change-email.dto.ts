import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RequestChangeEmailDto {
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu hiện tại' })
  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  currentPassword: string;

  @IsNotEmpty({ message: 'Vui lòng nhập email mới' })
  @IsEmail({}, { message: 'Định dạng email không hợp lệ' })
  newEmail: string;
}

export class ConfirmChangeEmailDto {
  @IsNotEmpty()
  @IsEmail()
  oldEmail: string;

  @IsNotEmpty()
  @IsString()
  otp: string;
}
