import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  Query,
  UseGuards,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';

@Controller('comments')
@ApiTags('Comments')
@ApiCookieAuth('access_token')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  create(@Body() dto: CreateCommentDto, @Req() req: any) {
    return this.commentsService.createComment(dto, req.user.userId);
  }

  @Get('task/:taskId')
  getByTask(
    @Param('taskId') taskId: string,
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.commentsService.getCommentsByTask(
      taskId,
      req.user.userId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get('task/:taskId/mention-candidates')
  getMentionCandidates(@Param('taskId') taskId: string, @Req() req: any) {
    return this.commentsService.getMentionCandidates(taskId, req.user.userId);
  }

  @Sse('task/:taskId/sse')
  stream(@Param('taskId') taskId: string, @Req() req: any): Promise<Observable<MessageEvent>> {
    return this.commentsService.getCommentStream(taskId, req.user.userId);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: any) {
    return this.commentsService.deleteComment(id, req.user.userId);
  }
}
