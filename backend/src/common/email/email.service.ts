import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.getOrThrow<string>('SMTP_HOST'),
      port: Number(this.config.get<number>('SMTP_PORT', 587)),
      secure: Number(this.config.get<number>('SMTP_PORT', 587)) === 465,
      auth: {
        user: this.config.getOrThrow<string>('SMTP_USER'),
        pass: this.config.getOrThrow<string>('SMTP_PASS'),
      },
    });
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    const html = this.buildPasswordResetHtml(resetUrl);
    await this.transporter.sendMail({
      from: this.config.get('SMTP_FROM', 'noreply@rfidinventory.com'),
      to,
      subject: 'Khôi phục mật khẩu — RFID Inventory',
      html,
    });
  }

  async sendVerificationEmail(to: string, verificationUrl: string): Promise<void> {
    const html = this.buildVerificationHtml(verificationUrl);
    await this.transporter.sendMail({
      from: this.config.get('SMTP_FROM', 'noreply@rfidinventory.com'),
      to,
      subject: 'Xác thực email — RFID Inventory',
      html,
    });
  }

  private buildPasswordResetHtml(resetUrl: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4c59a8; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0;">RFID Inventory</h1>
        </div>
        <div style="padding: 32px 24px;">
          <h2 style="color: #1e293b; margin-bottom: 16px;">Khôi phục mật khẩu</h2>
          <p style="color: #475569; line-height: 1.6;">
            Chúng tôi đã nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn.
            Nhấn vào nút bên dưới để đặt mật khẩu mới:
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background: #4c59a8; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Đặt lại mật khẩu
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">
            Liên kết này sẽ hết hạn sau <strong>15 phút</strong>. Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này.
          </p>
        </div>
      </div>
    `;
  }

  private buildVerificationHtml(verificationUrl: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4c59a8; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0;">RFID Inventory</h1>
        </div>
        <div style="padding: 32px 24px;">
          <h2 style="color: #1e293b; margin-bottom: 16px;">Xác thực email</h2>
          <p style="color: #475569; line-height: 1.6;">
            Cảm ơn bạn đã đăng ký! Nhấn vào nút bên dưới để xác thực email và kích hoạt tài khoản:
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verificationUrl}" style="background: #4c59a8; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Xác thực email
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">
            Liên kết này sẽ hết hạn sau <strong>24 giờ</strong>.
          </p>
        </div>
      </div>
    `;
  }
}
