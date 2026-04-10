import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

class ResetAdminPasswordScript {
  private static generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    const random = crypto.randomBytes(12);
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars[random[i] % chars.length];
    }
    return password;
  }

  private static async sendEmailNotification(email: string, tempPassword: string): Promise<void> {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || 'noreply@riotex.vn';

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.log('  (SMTP not configured — skipping email notification)');
      return;
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: smtpFrom,
      to: email,
      subject: '[RFID Inventory] Mật khẩu tạm thời đã được đặt lại',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #4c59a8;">RFID Inventory Manager</h2>
          <p>Tài khoản của bạn đã được Quản trị viên đặt lại mật khẩu tạm thời.</p>
          <p><strong>Mật khẩu tạm thời:</strong> <code style="background: #f4f7fe; padding: 4px 8px; border-radius: 4px; font-size: 16px;">${tempPassword}</code></p>
          <p>Bạn sẽ được yêu cầu đổi mật khẩu ngay sau khi đăng nhập.</p>
          <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng liên hệ Quản trị viên ngay.</p>
        </div>
      `,
    });

    console.log('  Email notification sent.');
  }

  static async run() {
    const args = process.argv.slice(2);
    const targetUsername = args[0];

    if (!targetUsername) {
      console.error('Lỗi: Bạn phải cung cấp Tên Đăng Nhập (Username) của người cần khôi phục.');
      console.error('Cú pháp đúng: npm run db:reset-admin -- <username>');
      process.exit(1);
    }

    console.log(`Đang tìm kiếm người dùng: ${targetUsername}...`);

    const user = await prisma.user.findUnique({
      where: { username: targetUsername },
    });

    if (!user) {
      console.error(`Lỗi: Không tìm thấy người dùng '${targetUsername}' trong hệ thống.`);
      process.exit(1);
    }

    if (user.role !== 'ADMIN') {
      console.warn(`Cảnh báo: Tài khoản '${targetUsername}' có Role là ${user.role}, không phải ADMIN. Vẫn tiến hành đổi mật khẩu.`);
    }

    const tempPassword = this.generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { username: targetUsername },
      data: {
        password: hashedPassword,
        passwordChangedAt: null, // Force password change on next login
      },
    });

    console.log('');
    console.log('✓ THÀNH CÔNG!');
    console.log(`  Đã đặt lại mật khẩu cho tài khoản '${targetUsername}'.`);
    console.log(`  Mật khẩu tạm: ${tempPassword}`);
    console.log('');
    console.log('  ⚠️ Người dùng sẽ phải đổi mật khẩu ngay sau khi đăng nhập lần tiếp theo.');

    if (user.email) {
      try {
        await this.sendEmailNotification(user.email, tempPassword);
      } catch (emailErr) {
        console.warn('  ⚠️ Không thể gửi email thông báo:', emailErr);
      }
    }
  }

  static handleError(error: unknown) {
    console.error('Có lỗi không mong muốn xảy ra:');
    console.error(error);
    process.exit(1);
  }

  static async disconnect() {
    await prisma.$disconnect();
  }
}

ResetAdminPasswordScript.run()
  .catch(ResetAdminPasswordScript.handleError)
  .finally(ResetAdminPasswordScript.disconnect);
