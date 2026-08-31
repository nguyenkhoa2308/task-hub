jest.mock('@nestjs/schedule', () => ({ Cron: () => () => undefined }));

import { CleanupService } from './cleanup.service';

describe('CleanupService', () => {
  const taskModel = {
    collection: { indexExists: jest.fn(), dropIndex: jest.fn() },
    find: jest.fn(),
    deleteOne: jest.fn(),
  };
  const projectModel = { find: jest.fn(), updateOne: jest.fn(), deleteOne: jest.fn() };
  const workspaceModel = {
    find: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
  };
  const commentModel = { deleteMany: jest.fn() };
  const activityModel = { deleteMany: jest.fn() };
  const cloudinaryService = { deleteAsset: jest.fn() };
  let service: CleanupService;

  beforeEach(() => {
    jest.clearAllMocks();
    for (const mock of [
      taskModel.deleteOne,
      projectModel.updateOne,
      projectModel.deleteOne,
      workspaceModel.updateOne,
      workspaceModel.deleteOne,
      commentModel.deleteMany,
      activityModel.deleteMany,
      cloudinaryService.deleteAsset,
    ]) mock.mockResolvedValue({ acknowledged: true });
    taskModel.find.mockResolvedValue([]);
    projectModel.find.mockResolvedValue([]);
    service = new CleanupService(
      taskModel as any,
      projectModel as any,
      workspaceModel as any,
      commentModel as any,
      activityModel as any,
      cloudinaryService as any,
    );
  });

  it('gỡ TTL index cũ để Cloudinary được cleanup trước database', async () => {
    taskModel.collection.indexExists.mockResolvedValue(true);
    taskModel.collection.dropIndex.mockResolvedValue(undefined);
    await service.onModuleInit();
    expect(taskModel.collection.dropIndex).toHaveBeenCalledWith('deletedAt_1');
  });

  it('xóa Cloudinary asset và dữ liệu liên quan trước khi xóa task', async () => {
    const task = {
      _id: 'task-1',
      project: 'project-1',
      attachments: [{
        cloudinaryPublicId: 'task-hub/tasks/file-1',
        cloudinaryResourceType: 'raw',
        cloudinaryDeliveryType: 'authenticated',
      }],
    };

    await (service as any).purgeTask(task);

    expect(cloudinaryService.deleteAsset).toHaveBeenCalledWith(
      'task-hub/tasks/file-1', 'raw', 'authenticated',
    );
    expect(commentModel.deleteMany).toHaveBeenCalledWith({ task: 'task-1' });
    expect(activityModel.deleteMany).toHaveBeenCalledWith({ resourceType: 'Task', resourceId: 'task-1' });
    expect(projectModel.updateOne).toHaveBeenCalledWith(
      { _id: 'project-1' }, { $pull: { tasks: 'task-1' } },
    );
    expect(taskModel.deleteOne).toHaveBeenCalledWith({ _id: 'task-1' });
    expect(cloudinaryService.deleteAsset.mock.invocationCallOrder[0])
      .toBeLessThan(taskModel.deleteOne.mock.invocationCallOrder[0]);
  });

  it('giữ task trong database nếu xóa Cloudinary thất bại', async () => {
    cloudinaryService.deleteAsset.mockRejectedValueOnce(new Error('Cloudinary unavailable'));
    const task = {
      _id: 'task-1',
      project: 'project-1',
      attachments: [{
        cloudinaryPublicId: 'task-hub/tasks/file-1',
        cloudinaryResourceType: 'raw',
        cloudinaryDeliveryType: 'authenticated',
      }],
    };

    await expect((service as any).purgeTask(task)).rejects.toThrow('Cloudinary unavailable');
    expect(commentModel.deleteMany).not.toHaveBeenCalled();
    expect(taskModel.deleteOne).not.toHaveBeenCalled();
  });

  it('xóa project con và activity trước khi xóa vĩnh viễn workspace', async () => {
    const workspace = { _id: 'workspace-1' };
    const project = {
      _id: 'project-1',
      workspace: 'workspace-1',
    };
    projectModel.find.mockResolvedValueOnce([project]);
    taskModel.find.mockResolvedValueOnce([]);

    await (service as any).purgeWorkspace(workspace);

    expect(projectModel.find).toHaveBeenCalledWith({ workspace: 'workspace-1' });
    expect(activityModel.deleteMany).toHaveBeenCalledWith({
      resourceType: 'Project',
      resourceId: 'project-1',
    });
    expect(projectModel.deleteOne).toHaveBeenCalledWith({ _id: 'project-1' });
    expect(activityModel.deleteMany).toHaveBeenCalledWith({
      resourceType: 'Workspace',
      resourceId: 'workspace-1',
    });
    expect(workspaceModel.deleteOne).toHaveBeenCalledWith({ _id: 'workspace-1' });
    expect(projectModel.deleteOne.mock.invocationCallOrder[0])
      .toBeLessThan(workspaceModel.deleteOne.mock.invocationCallOrder[0]);
  });
});
