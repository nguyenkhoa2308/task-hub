import { IsEnum } from 'class-validator';

export class UpdateMemberRoleDto {
  @IsEnum(['admin', 'member', 'viewer'], {
    message: 'Quyền phải là admin, member hoặc viewer',
  })
  role!: 'admin' | 'member' | 'viewer';
}
