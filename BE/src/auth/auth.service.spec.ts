import { AuthService } from './auth.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: any;
  let jwtService: any;

  beforeEach(() => {
    usersService = {
      findByIdWithRefreshToken: jest.fn(),
      updateRefreshToken: jest.fn(),
    };
    jwtService = { verifyAsync: jest.fn() };
    service = new AuthService(usersService, jwtService, {} as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('revokes the current refresh token on logout', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 'user-1' });
    usersService.findByIdWithRefreshToken.mockResolvedValue({
      refreshToken: await bcrypt.hash('refresh-token', 4),
    });

    await service.logout('refresh-token');

    expect(usersService.updateRefreshToken).toHaveBeenCalledWith('user-1', null);
  });

  it('does not fail logout for an invalid token', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid token'));

    await expect(service.logout('invalid')).resolves.toBeUndefined();
    expect(usersService.updateRefreshToken).not.toHaveBeenCalled();
  });
});
