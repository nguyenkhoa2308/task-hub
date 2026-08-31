import { ForbiddenException } from '@nestjs/common';
import { MembersService } from './members.service';

describe('MembersService - role boundaries', () => {
  const workspaceModel = { findOne: jest.fn() };
  const projectModel = { updateMany: jest.fn() };
  let service: MembersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MembersService(
      workspaceModel as any, projectModel as any, {} as any, {} as any, {} as any,
    );
  });

  const createWorkspace = (requesterRole: string, targetRole: string) => ({
    owner: { toString: () => requesterRole === 'owner' ? 'requester' : 'owner' },
    members: [
      { user: { toString: () => 'requester' }, role: requesterRole, status: 'active' },
      { user: { toString: () => 'target' }, role: targetRole, status: 'active' },
    ],
    save: jest.fn().mockResolvedValue(undefined),
  });

  it('owner có thể nâng thành viên thành admin', async () => {
    const workspace = createWorkspace('owner', 'member');
    workspaceModel.findOne.mockResolvedValue(workspace);
    await service.updateMemberRole('workspace-1', 'requester', 'target', 'admin');
    expect(workspace.members[1].role).toBe('admin');
    expect(workspace.save).toHaveBeenCalled();
  });

  it('admin không thể nâng người khác thành admin', async () => {
    workspaceModel.findOne.mockResolvedValue(createWorkspace('admin', 'member'));
    await expect(service.updateMemberRole('workspace-1', 'requester', 'target', 'admin'))
      .rejects.toBeInstanceOf(ForbiddenException);
  });

  it('admin không thể xóa admin khác', async () => {
    workspaceModel.findOne.mockResolvedValue(createWorkspace('admin', 'admin'));
    await expect(service.removeMember('workspace-1', 'requester', 'target'))
      .rejects.toBeInstanceOf(ForbiddenException);
    expect(projectModel.updateMany).not.toHaveBeenCalled();
  });
});
