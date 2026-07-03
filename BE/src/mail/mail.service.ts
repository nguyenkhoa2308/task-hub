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
    const frontendUrl =
      process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyUrl = `${frontendUrl}/auth/verify-email?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: `"Task Hub"`,
        to: email,
        subject: 'Xác thực tài khoản Task Hub',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4F46E5;">Chào mừng đến với Task Hub! 🎉</h2>
            <p>Cảm ơn bạn đã đăng ký. Vui lòng xác thực email để kích hoạt tài khoản.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}"
                 style="background-color: #4F46E5; color: white; padding: 12px 30px;
                        text-decoration: none; border-radius: 6px; font-weight: bold;">
                Xác thực email
              </a>
            </div>
            <p style="color: #6B7280; font-size: 14px;">
              Link có hiệu lực trong <strong>24 giờ</strong>.
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
}
