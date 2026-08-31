import { Controller, Post, Get, Patch, Body, Query, Res, Inject, Req, HttpException, HttpStatus, UseGuards, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { ARCJET, type ArcjetNest, tokenBucket, validateEmail } from '@arcjet/nest';

import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(ARCJET) private readonly arcjet: ArcjetNest) { }

  private async enforceRateLimit(
    req: Request,
    options: { capacity: number; refillRate: number; interval: string },
  ) {
    const decision = await this.arcjet
      .withRule(tokenBucket({ mode: 'LIVE', ...options }))
      .protect(req, { requested: 1 });
    if (decision.isDenied()) {
      throw new HttpException(
        decision.reason.isRateLimit()
          ? 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.'
          : 'Yêu cầu bị từ chối.',
        decision.reason.isRateLimit()
          ? HttpStatus.TOO_MANY_REQUESTS
          : HttpStatus.FORBIDDEN,
      );
    }
  }

  @Post('register')
  async signUp(@Req() req: Request, @Body() dto: SignUpDto) {
    await this.enforceRateLimit(req, { capacity: 3, refillRate: 3, interval: '1h' });

    const decision = await this.arcjet
      .withRule(
        validateEmail({
          mode: 'LIVE',
          deny: ['DISPOSABLE', 'INVALID', 'NO_MX_RECORDS'],
        }),
      )
      .protect(req, { email: dto.email });

    if (decision.isDenied()) {
      throw new HttpException(
        'Email không hợp lệ hoặc là email rác dùng một lần!',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.authService.signUp(dto);
  }

  @Post('login')
  async signIn(
    @Req() req: Request,
    @Body() dto: SignInDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.enforceRateLimit(req, { capacity: 5, refillRate: 5, interval: '10m' });
    const { access_token, refresh_token, user } = await this.authService.signIn(dto);

    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 phút (khớp với JWT expiresIn)
    });

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      path: '/',
    });

    return { message: 'Đăng nhập thành công!', user };
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  async refresh(
    @Req() req: Request & { user: { userId: string; refreshToken: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.refreshToken(
      req.user.userId,
      req.user.refreshToken,
    );

    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return { message: 'Token refreshed thành công' };
  }

  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      await this.authService.logout(req.cookies?.refresh_token);
    } finally {
      res.clearCookie('access_token');
      res.clearCookie('refresh_token', { path: '/' });
    }
    return { message: 'Đăng xuất thành công' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: Request & { user: { userId: string; email: string } }) {
    const user = await this.authService.getProfile(req.user.userId);
    return { user };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @Req() req: Request & { user: { userId: string } },
    @Body() dto: { name?: string; profileImage?: string },
  ) {
    const user = await this.authService.updateProfile(req.user.userId, dto);
    return { message: 'Cập nhật hồ sơ thành công!', user };
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile/avatar')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadAvatar(
    @Req() req: Request & { user: { userId: string } },
    @UploadedFile() file: any,
  ) {
    const user = await this.authService.uploadAvatar(req.user.userId, file);
    return { message: 'Đã cập nhật ảnh đại diện', user };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Req() req: Request & { user: { userId: string } },
    @Body() dto: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(
      req.user.userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Post('verify-email')
  async verifyEmail(@Req() req: Request, @Body() dto: { email: string; otp: string }) {
    await this.enforceRateLimit(req, { capacity: 5, refillRate: 5, interval: '15m' });
    return this.authService.verifyEmail(dto.email, dto.otp);
  }

  @Post('resend-verification')
  async resendVerification(@Req() req: Request, @Body('email') email: string) {
    await this.enforceRateLimit(req, { capacity: 3, refillRate: 3, interval: '1h' });
    return this.authService.resendVerification(email);
  }

  @Post('forgot-password')
  async forgotPassword(@Req() req: Request, @Body('email') email: string) {
    await this.enforceRateLimit(req, { capacity: 3, refillRate: 3, interval: '1h' });
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  async resetPassword(
    @Req() req: Request,
    @Body() dto: { email: string; otp: string; newPassword: string },
  ) {
    await this.enforceRateLimit(req, { capacity: 5, refillRate: 5, interval: '15m' });
    return this.authService.resetPassword(dto.email, dto.otp, dto.newPassword);
  }
}
