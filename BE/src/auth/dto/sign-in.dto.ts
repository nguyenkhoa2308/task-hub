import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';

export class SignInDto {
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, {
    message: 'Password must be at least 6 characters long',
  })
  password!: string;
}
