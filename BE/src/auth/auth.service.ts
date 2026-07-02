import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async signUp(dto: SignUpDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      ...dto,
      password: hashedPassword,
    });

    // Tạo verification token
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await this.usersService.saveVerifyToken(
      user._id.toString(),
      verifyToken,
      verifyExpires,
    );

    // Gửi email xác thực
    await this.mailService.sendVerificationEmail(user.email, verifyToken);

    return {
      message:
        'Đăng ký thành công! Hãy check email để verify tài khoản của bạn.',
    };
  }

  async verifyEmail(token: string) {
    const user = await this.usersService.findByVerifyToken(token);

    if (!user) {
      throw new BadRequestException('Token không hợp lệ');
    }

    if (!user.emailVerifyExpires || user.emailVerifyExpires < new Date()) {
      throw new BadRequestException('Token đã hết hạn. Vui lòng đăng ký lại.');
    }

    await this.usersService.markEmailVerified(user._id.toString());

    return { message: 'Xác thực email thành công! Bạn có thể đăng nhập.' };
  }

  async signIn(dto: SignInDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Chặn login nếu chưa verify email
    if (!user.isEmailVerified) {
      throw new ForbiddenException(
        'Tài khoản chưa được xác thực. Vui lòng kiểm tra email.',
      );
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    return this.generateTokens(user._id.toString(), user.email);
  }

  private generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    return { access_token: accessToken, refresh_token: refreshToken };
  }
}
