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
  ) { }

  async signUp(dto: SignUpDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email đã tồn tại');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      ...dto,
      password: hashedPassword,
    });

    const verifyOtp = crypto.randomInt(100000, 999999).toString();
    const verifyOtpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

    await this.usersService.saveVerifyOtp(
      user._id.toString(),
      verifyOtp,
      verifyOtpExpires,
    );

    // Gửi email xác thực
    await this.mailService.sendVerificationEmail(user.email, verifyOtp);

    return {
      message:
        'Đăng ký thành công! Hãy kiểm tra email để xác thực tài khoản của bạn.',
    };
  }

  async verifyEmail(email: string, otp: string) {
    const user = await this.usersService.findByEmailAndVerifyOtp(email, otp);

    if (!user) {
      throw new BadRequestException('Mã OTP không hợp lệ hoặc sai email');
    }

    if (!user.emailVerifyOtpExpires || user.emailVerifyOtpExpires < new Date()) {
      throw new BadRequestException('Mã OTP đã hết hạn. Vui lòng đăng ký lại.');
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
        'EMAIL_NOT_VERIFIED', // Trả về mã lỗi để FE nhận biết
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

  // Gửi lại email xác thực với OTP mới
  async resendVerification(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('Không tìm thấy người dùng');
    }
    if (user.isEmailVerified) {
      throw new BadRequestException('Email đã được xác thực');
    }

    const verifyOtp = crypto.randomInt(100000, 999999).toString();
    const verifyOtpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

    await this.usersService.saveVerifyOtp(
      user._id.toString(),
      verifyOtp,
      verifyOtpExpires,
    );

    await this.mailService.sendVerificationEmail(user.email, verifyOtp);

    return { message: 'Đã gửi lại mã xác thực. Vui lòng kiểm tra email.' };
  }

  // Quên mật khẩu — gửi OTP qua email
  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Trả về thành công để tránh leak thông tin user
      return { message: 'Nếu email tồn tại, chúng tôi đã gửi mã OTP đặt lại mật khẩu.' };
    }

    const resetOtp = crypto.randomInt(100000, 999999).toString();
    const resetOtpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

    await this.usersService.savePasswordResetOtp(
      user._id.toString(),
      resetOtp,
      resetOtpExpires,
    );

    await this.mailService.sendPasswordResetEmail(user.email, resetOtp);

    return { message: 'Nếu email tồn tại, chúng tôi đã gửi mã OTP đặt lại mật khẩu.' };
  }

  // Đặt lại mật khẩu với OTP
  async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await this.usersService.findByEmailAndResetOtp(email, otp);

    if (!user) {
      throw new BadRequestException('Mã OTP không hợp lệ hoặc sai email');
    }

    if (!user.passwordResetOtpExpires || user.passwordResetOtpExpires < new Date()) {
      throw new BadRequestException('Mã OTP đã hết hạn. Vui lòng yêu cầu lại.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(user._id.toString(), hashedPassword);
    await this.usersService.clearPasswordResetOtp(user._id.toString());

    return { message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập.' };
  }
}
