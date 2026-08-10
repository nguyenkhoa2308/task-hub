import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';

export class SignInDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email!: string;

  @IsString({ message: 'Password phải là chuỗi' })
  @IsNotEmpty({ message: 'Password không được để trống' })
  @MinLength(6, {
    message: 'Password phải có ít nhất 6 ký tự',
  })
  password!: string;
}
