import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProjectAccessService } from './project-access.service';

describe('ProjectAccessService', () => {
  const projectModel = { findById: jest.fn() };
  const workspaceModel = { findById: jest.fn() };
  let service: ProjectAccessService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProjectAccessService(projectModel as any, workspaceModel as any);
  });

  const setup = ({
    privateProject = false,
    projectRole,
    workspaceRole = 'member',
    workspaceStatus = 'active',
  }: {
    privateProject?: boolean;
    projectRole?: string;
    workspaceRole?: string;
    workspaceStatus?: string;
  } = {}) => {
    const project = {
      _id: 'project-1',
      workspace: 'workspace-1',
      isPrivate: privateProject,
      deletedAt: null,
      members: projectRole ? [{ user: 'user-1', role: projectRole }] : [],
    };
    const workspace = {
      _id: 'workspace-1',
      deletedAt: null,
      members: [{ user: 'user-1', role: workspaceRole, status: workspaceStatus }],
    };
    projectModel.findById.mockResolvedValue(project);
    workspaceModel.findById.mockResolvedValue(workspace);
    return { project, workspace };
  };

  it('cho phép thành viên đọc private project mà họ tham gia', async () => {
    const { project } = setup({ privateProject: true, projectRole: 'viewer' });
    await expect(service.assertCanReadProject('project-1', 'user-1')).resolves.toBe(project);
  });

  it('từ chối workspace admin nếu không thuộc private project', async () => {
    setup({ privateProject: true, workspaceRole: 'admin' });
    await expect(service.assertCanReadProject('project-1', 'user-1')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('cho phép workspace admin đọc public project', async () => {
    const { project } = setup({ workspaceRole: 'admin' });
    await expect(service.assertCanReadProject('project-1', 'user-1')).resolves.toBe(project);
  });

  it('từ chối thành viên pending', async () => {
    setup({ projectRole: 'contributor', workspaceStatus: 'pending' });
    await expect(service.assertCanReadProject('project-1', 'user-1')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('ẩn project đã xóa như một tài nguyên không tồn tại', async () => {
    const { project } = setup({ projectRole: 'manager' });
    project.deletedAt = new Date() as any;
    await expect(service.assertCanReadProject('project-1', 'user-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('ẩn project khi workspace đang ở thùng rác', async () => {
    const { workspace } = setup({ projectRole: 'manager' });
    workspace.deletedAt = new Date() as any;
    await expect(service.assertCanReadProject('project-1', 'user-1')).rejects.toBeInstanceOf(NotFoundException);
  });
});
