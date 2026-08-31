import { ForbiddenException } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';

describe('WorkspacesService - trash lifecycle', () => {
  const workspaceModel = { findOne: jest.fn() };
  const projectModel = { updateMany: jest.fn() };
  let service: WorkspacesService;

  beforeEach(() => {
    jest.clearAllMocks();
    projectModel.updateMany.mockResolvedValue({ modifiedCount: 2 });
    service = new WorkspacesService(
      workspaceModel as any, projectModel as any, {} as any, {} as any, {} as any,
    );
  });

  const workspace = (role = 'owner') => ({
    _id: 'workspace-1',
    owner: { toString: () => 'owner-1' },
    members: [{ user: 'owner-1', role, status: 'active' }],
    deletedAt: null as Date | null,
    deletedBy: null as any,
    save: jest.fn().mockResolvedValue(undefined),
  });

  it('soft delete workspace và chỉ đánh dấu project chưa bị xóa', async () => {
    const doc = workspace();
    workspaceModel.findOne.mockResolvedValue(doc);
    await service.deleteWorkspace('workspace-1', 'owner-1');
    expect(doc.deletedAt).toBeInstanceOf(Date);
    expect(doc.save).toHaveBeenCalled();
    expect(projectModel.updateMany).toHaveBeenCalledWith(
      { workspace: 'workspace-1', deletedAt: null },
      { $set: { deletedAt: doc.deletedAt, deletedViaWorkspace: true } },
    );
  });

  it('không cho admin xóa workspace', async () => {
    const doc = workspace('admin');
    doc.owner = { toString: () => 'another-owner' };
    workspaceModel.findOne.mockResolvedValue(doc);
    await expect(service.deleteWorkspace('workspace-1', 'owner-1')).rejects.toBeInstanceOf(ForbiddenException);
    expect(doc.save).not.toHaveBeenCalled();
  });

  it('restore workspace và chỉ phục hồi project bị xóa theo workspace', async () => {
    const doc = workspace();
    doc.deletedAt = new Date();
    workspaceModel.findOne.mockResolvedValue(doc);
    await service.restoreWorkspace('workspace-1', 'owner-1');
    expect(doc.deletedAt).toBeNull();
    expect(projectModel.updateMany).toHaveBeenCalledWith(
      { workspace: 'workspace-1', deletedViaWorkspace: true },
      { $set: { deletedAt: null, deletedViaWorkspace: false } },
    );
  });
});
