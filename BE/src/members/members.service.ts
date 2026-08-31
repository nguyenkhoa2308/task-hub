import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Workspace } from '../workspaces/schemas/workspace.schema';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { Project } from '../projects/schemas/project.schema';

@Injectable()
export class MembersService {
  constructor(
    @InjectModel(Workspace.name)
    private readonly workspaceModel: Model<Workspace>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<Project>,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async inviteMember(
    workspaceId: string,
    inviterId: string,
    dto: InviteMemberDto,
  ) {
    // 1. Tìm workspace
    const workspace = await this.workspaceModel.findOne({ _id: workspaceId, deletedAt: null });
    if (!workspace) {
      throw new NotFoundException('Workspace không tồn tại');
    }

    // 2. Kiểm tra quyền người mời (phải là owner hoặc admin)
    const inviterMember = workspace.members.find(
      (m: any) => m.user.toString() === inviterId.toString(),
    );
    const canMemberInvite = inviterMember?.role === 'member' && workspace.allowMembersInvite;
    if (!inviterMember || (!['owner', 'admin'].includes(inviterMember.role) && !canMemberInvite)) {
      throw new ForbiddenException(
        'Bạn không có quyền mời thành viên vào workspace này',
      );
    }
    if (canMemberInvite && dto.role === 'admin') {
      throw new ForbiddenException('Thành viên không thể mời quản trị viên');
    }

    // 3. Tìm user bằng email
    const invitedUser = await this.usersService.findByEmail(dto.email);
    if (!invitedUser) {
      throw new BadRequestException(
        'Email chưa đăng ký tài khoản trên hệ thống',
      );
    }

    // 4. Kiểm tra đã là thành viên chưa (cả active và pending)
    const existingMember = workspace.members.find(
      (m: any) => m.user.toString() === invitedUser._id.toString(),
    );
    if (existingMember) {
      // Nếu đang pending → tự động approve luôn (vì admin chủ động mời)
      if ((existingMember as any).status === 'pending') {
        (existingMember as any).status = 'active';
        (existingMember as any).role = dto.role;
        await workspace.save();

        const roleLabel = this.getRoleLabel(dto.role);
        await this.notificationsService.createNotification({
          recipient: invitedUser._id.toString(),
          sender: inviterId,
          type: 'WORKSPACE_INVITE',
          title: 'Yêu cầu tham gia đã được duyệt',
          message: `Yêu cầu tham gia workspace "${workspace.name}" đã được duyệt với vai trò ${roleLabel}`,
          link: `/workspaces/${workspaceId}`,
        });

        return { message: `${dto.email} đang chờ duyệt — đã tự động duyệt với vai trò ${roleLabel}` };
      }
      throw new ConflictException('Người dùng đã là thành viên của workspace này');
    }

    // 5. Thêm member vào workspace — active ngay vì admin chủ động mời
    workspace.members.push({
      user: invitedUser._id as any,
      role: dto.role,
      status: 'active',
      joinedAt: new Date(),
    } as any);
    await workspace.save();

    // 6. Lấy thông tin người mời
    const inviter = await this.usersService.findById(inviterId);
    const inviterName = inviter?.name || 'Ai đó';

    // 7. Gửi email thông báo
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/workspaces/${workspaceId}`;
    try {
      await this.mailService.sendWorkspaceInviteEmail(
        dto.email,
        inviterName,
        workspace.name,
        dto.role,
        inviteLink,
      );
    } catch (error) {
      // Email gửi thất bại không nên block việc thêm member
      console.error('Không thể gửi email mời:', error);
    }

    // 8. Tạo notification in-app
    const roleLabel = this.getRoleLabel(dto.role);

    await this.notificationsService.createNotification({
      recipient: invitedUser._id.toString(),
      sender: inviterId,
      type: 'WORKSPACE_INVITE',
      title: 'Lời mời tham gia Workspace',
      message: `${inviterName} đã mời bạn vào workspace "${workspace.name}" với vai trò ${roleLabel}`,
      link: `/workspaces/${workspaceId}`,
    });

    return {
      message: `Đã mời ${dto.email} vào workspace với vai trò ${roleLabel}`,
    };
  }

  async getPendingMembers(workspaceId: string, requesterId: string) {
    if (!isValidObjectId(workspaceId)) {
      throw new BadRequestException('Workspace ID không hợp lệ');
    }
    const workspace = await this.workspaceModel
      .findOne({ _id: workspaceId, deletedAt: null })
      .populate('members.user', 'name email profileImage');

    if (!workspace) {
      throw new NotFoundException('Workspace không tồn tại');
    }

    // Kiểm tra quyền: chỉ owner/admin mới xem được
    const requester = workspace.members.find(
      (m: any) => m.user?._id?.toString() === requesterId.toString() || m.user?.toString() === requesterId.toString(),
    );
    if (!requester || !['owner', 'admin'].includes(requester.role)) {
      throw new ForbiddenException('Bạn không có quyền xem danh sách chờ duyệt');
    }

    const pendingMembers = workspace.members.filter(
      (m: any) => m.status === 'pending',
    );

    return pendingMembers;
  }

  async approveMember(workspaceId: string, approverId: string, userId: string) {
    const workspace = await this.workspaceModel.findOne({ _id: workspaceId, deletedAt: null });
    if (!workspace) {
      throw new NotFoundException('Workspace không tồn tại');
    }

    // Kiểm tra quyền approver
    const approver = workspace.members.find(
      (m: any) => m.user.toString() === approverId.toString(),
    );
    if (!approver || !['owner', 'admin'].includes(approver.role)) {
      throw new ForbiddenException('Bạn không có quyền duyệt thành viên');
    }

    // Tìm member pending
    const pendingMember = workspace.members.find(
      (m: any) => m.user.toString() === userId.toString() && (m as any).status === 'pending',
    );
    if (!pendingMember) {
      throw new NotFoundException('Không tìm thấy yêu cầu tham gia');
    }

    // Duyệt
    (pendingMember as any).status = 'active';
    await workspace.save();

    // Lấy tên approver
    const approverUser = await this.usersService.findById(approverId);
    const approverName = approverUser?.name || 'Quản trị viên';

    // Notify người được duyệt
    await this.notificationsService.createNotification({
      recipient: userId,
      sender: approverId,
      type: 'WORKSPACE_INVITE',
      title: 'Yêu cầu tham gia đã được duyệt',
      message: `${approverName} đã duyệt yêu cầu tham gia workspace "${workspace.name}" của bạn`,
      link: `/workspaces/${workspaceId}`,
    });

    return { message: 'Đã duyệt thành viên thành công' };
  }

  async rejectMember(workspaceId: string, rejecterId: string, userId: string) {
    const workspace = await this.workspaceModel.findOne({ _id: workspaceId, deletedAt: null });
    if (!workspace) {
      throw new NotFoundException('Workspace không tồn tại');
    }

    // Kiểm tra quyền
    const rejecter = workspace.members.find(
      (m: any) => m.user.toString() === rejecterId.toString(),
    );
    if (!rejecter || !['owner', 'admin'].includes(rejecter.role)) {
      throw new ForbiddenException('Bạn không có quyền từ chối thành viên');
    }

    // Tìm và xoá member pending
    const pendingIndex = workspace.members.findIndex(
      (m: any) => m.user.toString() === userId.toString() && (m as any).status === 'pending',
    );
    if (pendingIndex === -1) {
      throw new NotFoundException('Không tìm thấy yêu cầu tham gia');
    }

    workspace.members.splice(pendingIndex, 1);
    await workspace.save();

    // Lấy tên rejecter
    const rejecterUser = await this.usersService.findById(rejecterId);
    const rejecterName = rejecterUser?.name || 'Quản trị viên';

    // Notify người bị từ chối
    await this.notificationsService.createNotification({
      recipient: userId,
      sender: rejecterId,
      type: 'WORKSPACE_INVITE',
      title: 'Yêu cầu tham gia bị từ chối',
      message: `${rejecterName} đã từ chối yêu cầu tham gia workspace "${workspace.name}" của bạn`,
    });

    return { message: 'Đã từ chối yêu cầu tham gia' };
  }

  async updateMemberRole(
    workspaceId: string,
    requesterId: string,
    userId: string,
    role: 'admin' | 'member' | 'viewer',
  ) {
    const workspace = await this.getWorkspaceForMemberManagement(workspaceId);
    const requester = this.findActiveMember(workspace, requesterId);
    const target = this.findActiveMember(workspace, userId);

    if (!requester || !['owner', 'admin'].includes(requester.role)) {
      throw new ForbiddenException('Bạn không có quyền thay đổi vai trò thành viên');
    }
    if (!target) throw new NotFoundException('Không tìm thấy thành viên');
    if (target.role === 'owner') {
      throw new BadRequestException('Hãy chuyển quyền sở hữu thay vì đổi vai trò của owner');
    }
    if (requester.role === 'admin' && (target.role === 'admin' || role === 'admin')) {
      throw new ForbiddenException('Chỉ owner có thể quản lý vai trò admin');
    }

    target.role = role;
    await workspace.save();
    return { message: 'Đã cập nhật vai trò thành viên', role };
  }

  async removeMember(workspaceId: string, requesterId: string, userId: string) {
    if (requesterId.toString() === userId.toString()) {
      return this.leaveWorkspace(workspaceId, requesterId);
    }

    const workspace = await this.getWorkspaceForMemberManagement(workspaceId);
    const requester = this.findActiveMember(workspace, requesterId);
    const target = this.findActiveMember(workspace, userId);
    if (!requester || !['owner', 'admin'].includes(requester.role)) {
      throw new ForbiddenException('Bạn không có quyền xóa thành viên');
    }
    if (!target) throw new NotFoundException('Không tìm thấy thành viên');
    if (target.role === 'owner') {
      throw new ForbiddenException('Không thể xóa owner khỏi workspace');
    }
    if (requester.role === 'admin' && target.role === 'admin') {
      throw new ForbiddenException('Admin không thể xóa admin khác');
    }

    await this.detachMember(workspace, userId);
    return { message: 'Đã xóa thành viên khỏi workspace' };
  }

  async leaveWorkspace(workspaceId: string, userId: string) {
    const workspace = await this.getWorkspaceForMemberManagement(workspaceId);
    const member = this.findActiveMember(workspace, userId);
    if (!member) throw new NotFoundException('Bạn không thuộc workspace này');
    if (member.role === 'owner' || workspace.owner.toString() === userId.toString()) {
      throw new BadRequestException('Owner phải chuyển quyền sở hữu trước khi rời workspace');
    }

    await this.detachMember(workspace, userId);
    return { message: 'Bạn đã rời workspace' };
  }

  async transferOwnership(workspaceId: string, requesterId: string, userId: string) {
    if (!userId) throw new BadRequestException('Thiếu thành viên nhận quyền sở hữu');
    if (requesterId.toString() === userId.toString()) {
      throw new BadRequestException('Bạn đang là owner của workspace');
    }

    const workspace = await this.getWorkspaceForMemberManagement(workspaceId);
    const owner = this.findActiveMember(workspace, requesterId);
    const nextOwner = this.findActiveMember(workspace, userId);
    if (!owner || owner.role !== 'owner' || workspace.owner.toString() !== requesterId.toString()) {
      throw new ForbiddenException('Chỉ owner hiện tại có thể chuyển quyền sở hữu');
    }
    if (!nextOwner) throw new NotFoundException('Người nhận phải là thành viên đang hoạt động');

    owner.role = 'admin';
    nextOwner.role = 'owner';
    workspace.owner = nextOwner.user;
    await workspace.save();
    return { message: 'Đã chuyển quyền sở hữu workspace', owner: userId };
  }

  private async getWorkspaceForMemberManagement(workspaceId: string) {
    const workspace = await this.workspaceModel.findOne({ _id: workspaceId, deletedAt: null });
    if (!workspace) throw new NotFoundException('Workspace không tồn tại');
    return workspace;
  }

  private findActiveMember(workspace: Workspace, userId: string): any {
    return workspace.members.find(
      (member: any) => member.user.toString() === userId.toString() && member.status !== 'pending',
    );
  }

  private async detachMember(workspace: Workspace, userId: string) {
    workspace.members = workspace.members.filter(
      (member: any) => member.user.toString() !== userId.toString(),
    ) as any;
    await workspace.save();
    await this.projectModel.updateMany(
      { workspace: workspace._id, 'members.user': userId },
      { $pull: { members: { user: userId } } },
    );
  }

  private getRoleLabel(role: string): string {
    switch (role) {
      case 'admin':
        return 'Quản trị viên';
      case 'viewer':
        return 'Người xem';
      default:
        return 'Thành viên';
    }
  }
}
