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

  async sendPasswordResetEmail(to: string, rawToken: string, username: string, resetUrl: string): Promise<void> {
    const html = this.buildPasswordResetHtml(rawToken, username, resetUrl);
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

  async sendWelcomeEmail(to: string, username: string, tempPassword: string, baseUrl: string): Promise<void> {
    const html = this.buildWelcomeHtml(username, tempPassword, baseUrl);
    await this.transporter.sendMail({
      from: this.config.get('SMTP_FROM', 'noreply@rfidinventory.com'),
      to,
      subject: 'Chào mừng bạn — RFID Inventory',
      html,
    });
  }

  private buildPasswordResetHtml(rawToken: string, username: string, resetUrl: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4c59a8; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0;">RFID Inventory</h1>
        </div>
        <div style="padding: 32px 24px;">
          <h2 style="color: #1e293b; margin-bottom: 16px;">Khôi phục mật khẩu</h2>
          <p style="color: #475569; line-height: 1.6;">
            Xin chào <strong>${username}</strong>, chúng tôi đã nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn.
          </p>
          <p style="color: #475569; line-height: 1.6; text-align: center; font-size: 18px; letter-spacing: 4px; background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 24px 0;">
            Mã khôi phục: <strong>${rawToken}</strong>
          </p>
          <p style="color: #475569; line-height: 1.6;">
            Nhấn vào nút bên dưới để đặt mật khẩu mới:
          </p>
          <div style="text-align: center; margin: 24px 0;">
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

  private buildWelcomeHtml(username: string, tempPassword: string, baseUrl: string): string {
    const loginUrl = `${baseUrl}/login`;
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4c59a8; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0;">RFID Inventory</h1>
        </div>
        <div style="padding: 32px 24px;">
          <h2 style="color: #1e293b; margin-bottom: 16px;">Chào mừng bạn!</h2>
          <p style="color: #475569; line-height: 1.6;">
            Tài khoản của bạn đã được tạo thành công. Dưới đây là thông tin đăng nhập tạm thời:
          </p>
          <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 8px; color: #475569;"><strong>Tên đăng nhập:</strong> ${username}</p>
            <p style="margin: 0 0 8px; color: #475569;"><strong>Mật khẩu tạm thời:</strong> ${tempPassword}</p>
          </div>
          <p style="color: #475569; line-height: 1.6;">
            <strong>Quan trọng:</strong> Bạn phải đổi mật khẩu ngay sau khi đăng nhập lần đầu.
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${loginUrl}" style="background: #4c59a8; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Đăng nhập ngay
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">
            Nếu bạn không yêu cầu tài khoản này, vui lòng bỏ qua email.
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
