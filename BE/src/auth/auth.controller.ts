import { Controller, Post, Get, Body, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto);
  }

  @Post('signin')
  async signIn(
    @Body() dto: SignInDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, refresh_token } = await this.authService.signIn(dto);

    const isProd = process.env.NODE_ENV === 'production';

    // Set HttpOnly cookie — JS không đọc được, bảo mật hơn localStorage
    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: isProd,       // chỉ HTTPS trên production
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 phút (khớp với JWT expiresIn)
    });

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      path: '/auth/refresh', // chỉ gửi khi gọi endpoint refresh
    });

    return { message: 'Đăng nhập thành công!' };
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }
}

