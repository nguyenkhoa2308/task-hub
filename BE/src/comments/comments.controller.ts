import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  create(@Body() dto: CreateCommentDto, @Req() req: any) {
    return this.commentsService.createComment(dto, req.user.userId);
  }

  @Get('task/:taskId')
  getByTask(@Param('taskId') taskId: string) {
    return this.commentsService.getCommentsByTask(taskId);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: any) {
    return this.commentsService.deleteComment(id, req.user.userId);
  }
}
