import { WorkspacesController } from './workspaces.controller';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('WorkspacesController', () => {
  let controller: WorkspacesController;

  beforeEach(() => {
    controller = new WorkspacesController({} as any);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('protects every workspace route with JWT', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, WorkspacesController) || [];
    expect(guards).toContain(JwtAuthGuard);
  });
});
