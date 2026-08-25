import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { Workspace } from './schemas/workspace.schema';
import { Project } from '../projects/schemas/project.schema';
import { Task } from '../tasks/schemas/task.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectModel(Workspace.name) private readonly workspaceModel: Model<Workspace>,
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
    @InjectModel(Task.name) private readonly taskModel: Model<Task>,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
  ) { }

  async createWorkSpace(createWorkspaceDto: CreateWorkspaceDto, userId: string) {
    const { name, description, color } = createWorkspaceDto;

    const workspace = await this.workspaceModel.create({
      name,
      description,
      color,
      owner: userId,
      members: [
        {
          user: userId,
          role: "owner",
          joinedAt: new Date()
        },
      ],
    })

    return workspace;
  }

  async getWorkspaces(userId: string) {
    const workspaces = await this.workspaceModel.find({
      members: { $elemMatch: { user: userId, status: { $ne: 'pending' } } },
    }).sort({ createdAt: -1 });
    return workspaces;
  }

  async getWorkspaceById(workspaceId: string, userId?: string) {
    const workspace = await this.workspaceModel
      .findById(workspaceId)
      .populate('members.user', 'name email profileImage')
      .populate({
        path: 'projects',
        populate: {
          path: 'members.user',
          select: 'name email profileImage',
        },
      });
    if (!workspace) {
      throw new NotFoundException("Không tìm thấy workspace")
    }

    if (userId) {
      const wsMember = workspace.members.find(
        (m: any) => (m.user?._id?.toString() || m.user?.toString()) === userId.toString(),
      );
      const isWsAdminOrOwner = wsMember && ['owner', 'admin'].includes(wsMember.role);

      const filteredProjects = (workspace.projects || []).filter((p: any) => {
        const isProjectMember = (p.members || []).some(
          (pm: any) => (pm.user?._id?.toString() || pm.user?.toString()) === userId.toString(),
        );

        if (isWsAdminOrOwner) {
          // Owner/Admin thấy dự án Công khai + dự án Riêng tư mà họ thuộc về
          return !p.isPrivate || isProjectMember;
        } else {
          // Thành viên thường: CHỈ thấy các dự án mà họ được thêm vào
          return isProjectMember;
        }
      });

      const wsObj = workspace.toObject();
      wsObj.projects = filteredProjects;
      return wsObj;
    }

    return workspace;
  }

  async updateWorkspace(workspaceId: string, updateWorkspaceDto: UpdateWorkspaceDto) {
    const workspace = await this.workspaceModel.findByIdAndUpdate(workspaceId, updateWorkspaceDto, { returnDocument: 'after' });
    if (!workspace) {
      throw new NotFoundException("Workspace không tồn tại");
    }
    return workspace;
  }

  async deleteWorkspace(workspaceId: string) {
    const workspace = await this.workspaceModel.findByIdAndDelete(workspaceId);
    if (!workspace) {
      throw new NotFoundException("Workspace không tồn tại");
    }
    return workspace;
  }

  async joinWorkspace(workspaceId: string, userId: string) {
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException("Workspace không tồn tại");
    }

    const existingMember = workspace.members.find(
      (m: any) => m.user.toString() === userId.toString()
    );

    if (existingMember) {
      if ((existingMember as any).status === 'pending') {
        return { message: "Yêu cầu tham gia đã được gửi, vui lòng chờ phê duyệt", status: 'pending', workspace };
      }
      return { message: "Bạn đã là thành viên của workspace này", status: 'active', workspace };
    }

    workspace.members.push({
      user: userId as any,
      role: 'member',
      status: 'pending',
      joinedAt: new Date(),
    } as any);

    await workspace.save();

    // Bắn thông báo real-time cho Owner và Admin của Workspace
    try {
      const joiningUser = await this.usersService.findById(userId);
      const joiningUserName = joiningUser?.name || 'Một người dùng';

      const adminsAndOwners = workspace.members.filter(
        (m: any) => ['owner', 'admin'].includes(m.role) && (m as any).status !== 'pending'
      );

      for (const adminMember of adminsAndOwners) {
        const recipientId = (adminMember.user?._id || adminMember.user).toString();
        await this.notificationsService.createNotification({
          recipient: recipientId,
          sender: userId,
          type: 'WORKSPACE_INVITE',
          title: 'Yêu cầu tham gia Workspace mới',
          message: `${joiningUserName} đã gửi yêu cầu tham gia workspace "${workspace.name}"`,
          link: `/workspaces/${workspaceId}`,
        });
      }
    } catch (err) {
      console.error('Không thể gửi thông báo cho quản trị viên:', err);
    }

    return { message: "Yêu cầu tham gia đã được gửi, vui lòng chờ phê duyệt", status: 'pending', workspace };
  }

  async getDashboardStats(userId: string, workspaceId?: string) {
    let projectQuery: any = {};

    if (workspaceId && workspaceId !== 'all') {
      projectQuery.workspace = workspaceId;
    } else {
      // Tìm tất cả workspace người dùng tham gia
      const userWorkspaces = await this.workspaceModel.find({
        members: { $elemMatch: { user: userId, status: { $ne: 'pending' } } },
      }).select('_id');
      const wsIds = userWorkspaces.map((w) => w._id);
      projectQuery.workspace = { $in: wsIds };
    }

    const projects = await this.projectModel
      .find(projectQuery)
      .populate('members.user', 'name email profileImage')
      .sort({ updatedAt: -1 });

    const projectIds = projects.map((p) => p._id);

    // Lấy tất cả task thuộc các project này
    const tasks = await this.taskModel
      .find({ project: { $in: projectIds }, isArchived: false })
      .populate('assignees', 'name email profileImage')
      .populate({
        path: 'project',
        select: 'title workspace',
        populate: { path: 'workspace', select: 'name color' },
      })
      .sort({ updatedAt: -1 });

    const totalTasks = tasks.length;
    const isDone = (status: string) => {
      if (!status) return false;
      const s = status.toLowerCase();
      return s === 'done' || s === 'completed' || s === 'hoàn thành';
    };

    const completedTasks = tasks.filter((t) => isDone(t.status)).length;
    const inProgressTasks = tasks.filter((t) => {
      const s = t.status?.toLowerCase() || '';
      return s === 'in_progress' || s === 'in progress' || s === 'đang thực hiện';
    }).length;
    const todoTasks = tasks.filter((t) => {
      const s = t.status?.toLowerCase() || '';
      return s === 'to do' || s === 'todo' || s === 'cần làm';
    }).length;
    const reviewTasks = tasks.filter((t) => {
      const s = t.status?.toLowerCase() || '';
      return s === 'review' || s === 'đang review';
    }).length;

    const now = new Date();
    const overdueTasks = tasks.filter((t) => {
      if (isDone(t.status)) return false;
      return t.dueDate && new Date(t.dueDate) < now;
    }).length;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 1. Task Trend: Daily task status changes (Line Chart - 7 ngày gần đây)
    const dailyTaskTrend: Array<{ date: string; created: number; completed: number; inProgress: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getDate()}/${d.getMonth() + 1}`;
      const dayStart = new Date(d.setHours(0, 0, 0, 0));
      const dayEnd = new Date(d.setHours(23, 59, 59, 999));

      const created = tasks.filter((t: any) => {
        const cDate = new Date(t.createdAt);
        return cDate >= dayStart && cDate <= dayEnd;
      }).length;

      const completed = tasks.filter((t: any) => {
        if (!isDone(t.status)) return false;
        const uDate = new Date(t.completedAt || t.updatedAt);
        return uDate >= dayStart && uDate <= dayEnd;
      }).length;

      const inProgress = tasks.filter((t: any) => {
        const s = t.status?.toLowerCase() || '';
        if (s !== 'in_progress' && s !== 'in progress' && s !== 'đang thực hiện') return false;
        const uDate = new Date(t.updatedAt);
        return uDate >= dayStart && uDate <= dayEnd;
      }).length;

      dailyTaskTrend.push({ date: dateStr, created, completed, inProgress });
    }

    // 2. Project Status: Status breakdown (Donut Chart)
    const projectStatusMap: Record<string, number> = {
      PLANNING: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      ON_HOLD: 0,
      CANCELLED: 0,
    };
    projects.forEach((p) => {
      const st = (p.status || 'PLANNING').toUpperCase();
      if (projectStatusMap[st] !== undefined) {
        projectStatusMap[st]++;
      } else {
        projectStatusMap.PLANNING++;
      }
    });

    const projectStatusBreakdown = [
      { name: 'Lập kế hoạch', value: projectStatusMap.PLANNING, color: '#8b5cf6' },
      { name: 'Đang thực hiện', value: projectStatusMap.IN_PROGRESS, color: '#3b82f6' },
      { name: 'Hoàn thành', value: projectStatusMap.COMPLETED, color: '#10b981' },
      { name: 'Tạm dừng', value: projectStatusMap.ON_HOLD, color: '#f59e0b' },
      { name: 'Đã hủy', value: projectStatusMap.CANCELLED, color: '#ef4444' },
    ].filter((item) => projects.length === 0 || item.value > 0);

    // 3. Task Priority: Priority distribution (Donut Chart)
    const highPriority = tasks.filter((t) => t.priority?.toLowerCase() === 'high').length;
    const mediumPriority = tasks.filter((t) => t.priority?.toLowerCase() === 'medium').length;
    const lowPriority = tasks.filter((t) => t.priority?.toLowerCase() === 'low').length;

    const taskPriorityDistribution = [
      { name: 'Cao', value: highPriority, color: '#f43f5e' },
      { name: 'Trung bình', value: mediumPriority, color: '#f59e0b' },
      { name: 'Thấp', value: lowPriority, color: '#64748b' },
    ];

    // 4. Workspace Productivity: Task completion by project (Bar Chart)
    const workspaceProductivity = projects.map((p) => {
      const pTasks = tasks.filter((t: any) => t.project?._id?.toString() === p._id.toString() || t.project?.toString() === p._id.toString());
      const pCompleted = pTasks.filter((t) => isDone(t.status)).length;
      return {
        name: p.title.length > 15 ? p.title.substring(0, 15) + '...' : p.title,
        completed: pCompleted,
        total: pTasks.length,
      };
    });

    // 5. Recent Projects: 3 dự án gần đây nhất
    const recentProjects = projects.slice(0, 3).map((p) => {
      const pTasks = tasks.filter((t: any) => t.project?._id?.toString() === p._id.toString() || t.project?.toString() === p._id.toString());
      const pCompleted = pTasks.filter((t) => isDone(t.status)).length;
      const pTotal = pTasks.length;
      const pProgress = pTotal > 0 ? Math.round((pCompleted / pTotal) * 100) : p.progress || 0;

      return {
        _id: p._id,
        title: p.title,
        description: p.description,
        status: p.status,
        workspaceId: p.workspace,
        progress: pProgress,
        totalTasks: pTotal,
        completedTasks: pCompleted,
        members: p.members,
        updatedAt: (p as any).updatedAt,
      };
    });

    // 6. Upcoming Tasks: Tasks due in the next 7 days (từ hôm nay đến 7 ngày tới), strictly sorted by dueDate ascending
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const next7DaysEnd = new Date();
    next7DaysEnd.setDate(next7DaysEnd.getDate() + 7);
    next7DaysEnd.setHours(23, 59, 59, 999);

    const upcomingTasks7Days = tasks
      .filter((t) => {
        if (isDone(t.status)) return false;
        if (!t.dueDate) return false;
        const due = new Date(t.dueDate);
        return due >= todayStart && due <= next7DaysEnd;
      })
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

    // 7. Overdue Tasks List: Tasks due before todayStart, strictly sorted by dueDate ascending
    const overdueTasksList = tasks
      .filter((t) => {
        if (isDone(t.status)) return false;
        if (!t.dueDate) return false;
        const due = new Date(t.dueDate);
        return due < todayStart;
      })
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

    const inProgressProjects = projects.filter((p) => (p.status || 'PLANNING').toUpperCase() === 'IN_PROGRESS').length;

    return {
      totalWorkspaces: (await this.workspaceModel.countDocuments({ members: { $elemMatch: { user: userId, status: { $ne: 'pending' } } } })),
      totalProjects: projects.length,
      inProgressProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      reviewTasks,
      overdueTasks,
      completionRate,
      dailyTaskTrend,
      projectStatusBreakdown,
      taskPriorityDistribution,
      workspaceProductivity,
      recentProjects,
      upcomingTasks7Days,
      overdueTasksList,
    };
  }
}


