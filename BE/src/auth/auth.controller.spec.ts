jest.mock('@arcjet/nest', () => ({
  ARCJET: 'ARCJET',
  validateEmail: jest.fn(() => ({})),
  tokenBucket: jest.fn(() => ({})),
}));

import { AuthController } from './auth.controller';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: any;
  let arcjet: any;

  beforeEach(() => {
    authService = { signIn: jest.fn() };
    arcjet = {
      withRule: jest.fn(),
      protect: jest.fn(),
    };
    arcjet.withRule.mockReturnValue(arcjet);
    controller = new AuthController(authService, arcjet);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('blocks login when the rate limit is exceeded', async () => {
    arcjet.protect.mockResolvedValue({
      isDenied: () => true,
      reason: { isRateLimit: () => true },
    });

    await expect(controller.signIn(
      {} as any,
      { email: 'user@example.com', password: 'password123' },
      {} as any,
    )).rejects.toMatchObject<HttpException>({ status: HttpStatus.TOO_MANY_REQUESTS });
    expect(authService.signIn).not.toHaveBeenCalled();
  });

  it('allows login while the request is within the limit', async () => {
    arcjet.protect.mockResolvedValue({ isDenied: () => false });
    authService.signIn.mockResolvedValue({
      access_token: 'access',
      refresh_token: 'refresh',
      user: { _id: 'user-1' },
    });
    const response = { cookie: jest.fn() };

    await controller.signIn(
      {} as any,
      { email: 'user@example.com', password: 'password123' },
      response as any,
    );

    expect(authService.signIn).toHaveBeenCalled();
    expect(response.cookie).toHaveBeenCalledTimes(2);
  });

  it('uses cross-site secure cookies in production', async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    arcjet.protect.mockResolvedValue({ isDenied: () => false });
    authService.signIn.mockResolvedValue({
      access_token: 'access',
      refresh_token: 'refresh',
      user: { _id: 'user-1' },
    });
    const response = { cookie: jest.fn() };

    try {
      await controller.signIn(
        {} as any,
        { email: 'user@example.com', password: 'password123' },
        response as any,
      );

      expect(response.cookie).toHaveBeenCalledWith(
        'access_token',
        'access',
        expect.objectContaining({ secure: true, sameSite: 'none' }),
      );
      expect(response.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'refresh',
        expect.objectContaining({ secure: true, sameSite: 'none' }),
      );
    } finally {
      if (previousNodeEnv === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = previousNodeEnv;
      }
    }
  });
});
