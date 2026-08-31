import { BadRequestException, Body, Controller, Delete, Param, Req, UseGuards } from '@nestjs/common';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsMongoId } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CleanupService } from './cleanup.service';

class PermanentDeleteDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsMongoId({ each: true })
  ids!: string[];
}

@Controller('trash')
@UseGuards(JwtAuthGuard)
export class TrashController {
  constructor(private readonly cleanupService: CleanupService) {}

  @Delete('empty')
  empty(@Req() req: any) {
    return this.cleanupService.emptyUserTrash(req.user.userId);
  }

  @Delete(':kind')
  removeMany(
    @Param('kind') kind: 'tasks' | 'projects' | 'workspaces',
    @Body() dto: PermanentDeleteDto,
    @Req() req: any,
  ) {
    if (!['tasks', 'projects', 'workspaces'].includes(kind)) {
      throw new BadRequestException('Loại dữ liệu thùng rác không hợp lệ');
    }
    return this.cleanupService.permanentlyDelete(kind, dto.ids, req.user.userId);
  }
}
