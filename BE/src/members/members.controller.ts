import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { MembersService } from './members.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @UseGuards(JwtAuthGuard)
  @Post('invite/workspace/:id')
  inviteMember(
    @Param('id') workspaceId: string,
    @Body() inviteMemberDto: InviteMemberDto,
    @Req() req: any,
  ) {
    const inviterId = req.user.userId;
    return this.membersService.inviteMember(
      workspaceId,
      inviterId,
      inviteMemberDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('pending/workspace/:id')
  getPendingMembers(
    @Param('id') workspaceId: string,
    @Req() req: any,
  ) {
    const requesterId = req.user.userId;
    return this.membersService.getPendingMembers(workspaceId, requesterId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('approve/workspace/:id')
  approveMember(
    @Param('id') workspaceId: string,
    @Body('userId') userId: string,
    @Req() req: any,
  ) {
    const approverId = req.user.userId;
    return this.membersService.approveMember(workspaceId, approverId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('reject/workspace/:id')
  rejectMember(
    @Param('id') workspaceId: string,
    @Body('userId') userId: string,
    @Req() req: any,
  ) {
    const rejecterId = req.user.userId;
    return this.membersService.rejectMember(workspaceId, rejecterId, userId);
  }
}
