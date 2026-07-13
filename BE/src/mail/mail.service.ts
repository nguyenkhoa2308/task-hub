import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.MAIL_PORT) || 465,
      secure: true, // true cho port 465
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS, // Gmail App Password
      },
    });
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"Task Hub"`,
        to: email,
        subject: 'Xác thực tài khoản Task Hub',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4F46E5;">Chào mừng đến với Task Hub! 🎉</h2>
            <p>Cảm ơn bạn đã đăng ký. Vui lòng nhập mã OTP dưới đây để xác thực email của bạn.</p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #F3F4F6; color: #1F2937; padding: 16px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 8px;">
                ${token}
              </div>
            </div>
            <p style="color: #6B7280; font-size: 14px;">
              Mã OTP có hiệu lực trong <strong>15 phút</strong>.
              Nếu bạn không đăng ký, hãy bỏ qua email này.
            </p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">
            <p style="color: #9CA3AF; font-size: 12px;">Task Hub — Quản lý công việc hiệu quả</p>
          </div>
        `,
      });
    } catch (error) {
      console.error('Mail send error:', error);
      throw new InternalServerErrorException('Không thể gửi email xác thực');
    }
  }

  async sendPasswordResetEmail(email: string, otp: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"Task Hub"`,
        to: email,
        subject: 'Đặt lại mật khẩu Task Hub',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4F46E5;">Đặt lại mật khẩu 🔐</h2>
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng nhập mã OTP dưới đây để tiếp tục.</p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #F3F4F6; color: #1F2937; padding: 16px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 8px;">
                ${otp}
              </div>
            </div>
            <p style="color: #6B7280; font-size: 14px;">
              Mã OTP có hiệu lực trong <strong>15 phút</strong>.
              Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
            </p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">
            <p style="color: #9CA3AF; font-size: 12px;">Task Hub — Quản lý công việc hiệu quả</p>
          </div>
        `,
      });
    } catch (error) {
      console.error('Mail send error:', error);
      throw new InternalServerErrorException('Không thể gửi email đặt lại mật khẩu');
    }
  }
}
