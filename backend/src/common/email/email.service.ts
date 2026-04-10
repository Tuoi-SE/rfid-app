import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import * as ejs from 'ejs';
import { join } from 'path';

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

  /**
   * Gửi email khôi phục mật khẩu.
   * @param to Địa chỉ email người nhận.
   * @param rawToken Mã token khôi phục.
   * @param username Tên người dùng.
   * @param resetUrl Đường dẫn đặt lại mật khẩu.
   */
  async sendPasswordResetEmail(to: string, rawToken: string, username: string, resetUrl: string): Promise<void> {
    const html = await this.buildPasswordResetHtml(rawToken, username, resetUrl);
    await this.transporter.sendMail({
      from: this.config.get('SMTP_FROM', 'noreply@rfidinventory.com'),
      to,
      subject: 'Khôi phục mật khẩu — RFID Inventory',
      html,
    });
  }

  /**
   * Gửi email xác thực tải khoản.
   * @param to Địa chỉ email người nhận.
   * @param verificationUrl Đường dẫn xác thực email.
   */
  async sendVerificationEmail(to: string, verificationUrl: string): Promise<void> {
    const html = await this.buildVerificationHtml(verificationUrl);
    await this.transporter.sendMail({
      from: this.config.get('SMTP_FROM', 'noreply@rfidinventory.com'),
      to,
      subject: 'Xác thực email — RFID Inventory',
      html,
    });
  }

  /**
   * Gửi email chào mừng cùng mật khẩu tạm thời.
   * @param to Địa chỉ email người nhận.
   * @param username Tên người dùng.
   * @param tempPassword Mật khẩu tạm thời.
   * @param baseUrl Đường dẫn gốc của ứng dụng.
   */
  async sendWelcomeEmail(to: string, username: string, tempPassword: string, baseUrl: string): Promise<void> {
    const html = await this.buildWelcomeHtml(username, tempPassword, baseUrl);
    await this.transporter.sendMail({
      from: this.config.get('SMTP_FROM', 'noreply@rfidinventory.com'),
      to,
      subject: 'Chào mừng bạn — RFID Inventory',
      html,
    });
  }

  /**
   * Tạo nội dung HTML cho email khôi phục mật khẩu.
   * @param rawToken Mã token khôi phục.
   * @param username Tên người dùng.
   * @param resetUrl Đường dẫn đặt lại mật khẩu.
   * @returns Chuỗi HTML nội dung email.
   */
  private async buildPasswordResetHtml(rawToken: string, username: string, resetUrl: string): Promise<string> {
    const templatePath = join(__dirname, 'templates', 'password-reset.ejs');
    return ejs.renderFile(templatePath, { rawToken, username, resetUrl });
  }

  /**
   * Tạo nội dung HTML cho email chào mừng.
   * @param username Tên người dùng.
   * @param tempPassword Mật khẩu tạm thời.
   * @param baseUrl Đường dẫn gốc của ứng dụng.
   * @returns Chuỗi HTML nội dung email.
   */
  private async buildWelcomeHtml(username: string, tempPassword: string, baseUrl: string): Promise<string> {
    const loginUrl = `${baseUrl}/login`;
    const templatePath = join(__dirname, 'templates', 'welcome.ejs');
    return ejs.renderFile(templatePath, { username, tempPassword, loginUrl });
  }

  /**
   * Tạo nội dung HTML cho email xác thực.
   * @param verificationUrl Đường dẫn xác thực email.
   * @returns Chuỗi HTML nội dung email.
   */
  private async buildVerificationHtml(verificationUrl: string): Promise<string> {
    const templatePath = join(__dirname, 'templates', 'verification.ejs');
    return ejs.renderFile(templatePath, { verificationUrl });
  }
}
