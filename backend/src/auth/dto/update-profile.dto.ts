import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsNotEmpty({ message: 'Vui lòng nhập họ và tên' })
  @IsString({ message: 'Họ và tên phải là chuỗi' })
  fullName: string;

  @IsOptional()
  @IsString()
  @Matches(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, { message: 'Số điện thoại không hợp lệ' })
  phone?: string;
}
