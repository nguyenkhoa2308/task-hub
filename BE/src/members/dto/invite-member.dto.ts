import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';

export class InviteMemberDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email!: string;

  @IsEnum(['admin', 'member', 'viewer'], {
    message: 'Quyền phải là admin, member hoặc viewer',
  })
  @IsNotEmpty({ message: 'Quyền không được để trống' })
  role!: 'admin' | 'member' | 'viewer';
}
