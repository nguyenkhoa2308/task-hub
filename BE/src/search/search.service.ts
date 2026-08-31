import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Workspace } from '../workspaces/schemas/workspace.schema';
import { Project } from '../projects/schemas/project.schema';
import { Task } from '../tasks/schemas/task.schema';

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Workspace.name) private readonly workspaceModel: Model<Workspace>,
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
    @InjectModel(Task.name) private readonly taskModel: Model<Task>,
  ) {}

  async search(rawQuery: string, userId: string) {
    const query = (rawQuery || '').trim().slice(0, 80);
    if (query.length < 2) return { workspaces: [], projects: [], tasks: [] };
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const memberWorkspaces = await this.workspaceModel.find({
      deletedAt: null,
      members: { $elemMatch: { user: userId, status: { $ne: 'pending' } } },
    }).select('name description color members owner').lean();
    const workspaceIds = memberWorkspaces.map((workspace) => workspace._id);
    const adminWorkspaceIds = memberWorkspaces.filter((workspace: any) => {
      const member = workspace.members.find((item: any) => item.user.toString() === userId);
      return workspace.owner?.toString() === userId || ['owner', 'admin'].includes(member?.role);
    }).map((workspace) => workspace._id);
    const projects = await this.projectModel.find({
      workspace: { $in: workspaceIds }, deletedAt: null, isArchived: false,
      $and: [
        { $or: [{ title: regex }, { description: regex }] },
        { $or: [{ isPrivate: false, workspace: { $in: adminWorkspaceIds } }, { members: { $elemMatch: { user: userId } } }] },
      ],
    }).select('title description workspace status').populate('workspace', 'name color').limit(8).lean();
    const visibleProjectIds = await this.projectModel.find({
      workspace: { $in: workspaceIds }, deletedAt: null, isArchived: false,
      $or: [{ isPrivate: false, workspace: { $in: adminWorkspaceIds } }, { members: { $elemMatch: { user: userId } } }],
    }).distinct('_id');
    const tasks = await this.taskModel.find({
      project: { $in: visibleProjectIds }, deletedAt: null, isArchived: false,
      $or: [{ title: regex }, { description: regex }],
    }).select('title description status priority project').populate({ path: 'project', select: 'title workspace', populate: { path: 'workspace', select: 'name color' } }).limit(10).lean();
    return {
      workspaces: memberWorkspaces.filter((workspace) => regex.test(workspace.name) || regex.test(workspace.description || '')).slice(0, 6),
      projects,
      tasks,
    };
  }
}
