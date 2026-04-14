import { Injectable, HttpStatus, Optional } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '@users/users.service';
import { PrismaService } from '@prisma/prisma.service';
import { BusinessException } from '@common/exceptions/business.exception';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { DEVICE_TYPES } from '@common/constants/error-codes';
import { EmailService } from '@common/email/email.service';
import { AUTH_ERROR_CODES } from '@common/constants/error-codes';

/** Số vòng bcrypt để hash password */
const SALT_ROUNDS = 12;


/**
 * AuthService — Xử lý logic xác thực người dùng.
 *
 * Chức năng:
 * - Xác thực username/password (validateUser)
 * - Đăng nhập, tạo cặp access + refresh token (login)
 * - Làm mới token khi access token hết hạn (refresh)
 * - Đăng xuất, thu hồi refresh token (logout)
 *
 * Bảo mật:
 * - Refresh token được hash SHA-256 trước khi lưu DB
 * - Token rotation: mỗi lần refresh sẽ thu hồi token cũ, cấp token mới
 * - Không trả password hash hay dữ liệu nhạy cảm trong response
 */
@Injectable()
export class AuthService {
  /** Secret key để ký refresh token (tách biệt với access token) */
  private readonly refreshSecret: string;
  /** Số ngày refresh token có hiệu lực */
  private readonly refreshExpDays: number;
  /** Thời gian sống access token (tính bằng giây) */
  private readonly accessExpSeconds: number;
  /** Thời gian sống refresh token (tính bằng giây) */
  private readonly refreshExpSeconds: number;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private activityLogService: ActivityLogService,
    private config: ConfigService,
    @Optional() private emailService?: EmailService,
  ) {
    this.refreshSecret = this.config.get('JWT_REFRESH_SECRET', this.config.getOrThrow('JWT_SECRET') + '_refresh');
    this.refreshExpDays = Number(this.config.get('JWT_REFRESH_EXPIRATION_DAYS', '7'));
    this.accessExpSeconds = this.parseExpirationToSeconds(this.config.get('JWT_ACCESS_EXPIRATION', '15m'));
    this.refreshExpSeconds = this.refreshExpDays * 24 * 60 * 60;
  }

  /**
   * Xác thực thông tin đăng nhập.
   * So sánh password (bcrypt) và trả về user info nếu hợp lệ, null nếu sai.
   * Được gọi bởi LocalStrategy (Passport).
   *
   * Bảo mật — Account Lockout:
   * - Khóa tài khoản sau 5 lần đăng nhập sai liên tiếp, trong 15 phút
   * - Kiểm tra lockout TRƯỚC khi so sánh password
   * - Đăng nhập thành công → reset failedLoginAttempts về 0
   * - Đăng nhập thất bại → tăng failedLoginAttempts, khóa nếu >= 5
   */
  async validateUser(loginKey: string, password: string) {
    // Try username first, then email
    let user = await this.usersService.findByUsername(loginKey);
    if (!user) {
      user = await this.prisma.user.findFirst({
        where: { email: loginKey, deletedAt: null },
        select: {
          id: true,
          username: true,
          fullName: true,
          phone: true,
          email: true,
          password: true,
          role: true,
          locationId: true,
          deletedAt: true,
          failedLoginAttempts: true,
          lockedUntil: true,
          passwordChangedAt: true,
        },
      });
    }
    if (!user) return null;

    // Reject soft-deleted users
    if (user.deletedAt) return null;

    // Check if account is locked (before password comparison)
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new BusinessException(
        'Tài khoản đã bị khóa tạm thời do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.',
        'AUTH_ACCOUNT_LOCKED',
        HttpStatus.FORBIDDEN,
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      // Atomic increment — race-safe, no read-modify-write
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: { increment: 1 },
        },
      });

      // Re-fetch to check lockout threshold after atomic increment
      const updated = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: { failedLoginAttempts: true },
      });

      if ((updated?.failedLoginAttempts || 0) >= 5) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
          },
        });
      }

      return null;
    }

    // Successful login — reset failed attempts and clear any lockout
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    }

    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      role: user.role,
      locationId: user.locationId,
      passwordChangedAt: user.passwordChangedAt,
    };
  }

  /**
   * Đăng nhập — tạo cặp access + refresh token.
   * Lưu hash của refresh token vào bảng RefreshToken.
   * Interceptor sẽ auto-wrap thành { success, message, data }.
   */
  async login(user: { id: string; username: string; email?: string | null; role: string; locationId?: string | null; fullName?: string | null; phone?: string | null; passwordChangedAt?: Date | null }, deviceType: string = DEVICE_TYPES.WEB, ipAddress?: string) {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Lưu hash refresh token vào DB để có thể thu hồi sau này
    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshExpDays);

    // Đảm bảo mỗi user chỉ có 1 session active cho mỗi loại thiết bị (WEB / MOBILE)
    await this.prisma.refreshToken.updateMany({
      where: {
        userId: user.id,
        deviceType,
        revoked: false
      },
      data: { revoked: true }
    });

    await this.prisma.refreshToken.create({
      data: {
        token: hashedToken,
        userId: user.id,
        deviceType,
        expiresAt,
      },
    });

    // Audit log: LOGIN_SUCCESS
    await this.activityLogService.log({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      entity: 'User',
      entityId: user.id,
      ipAddress,
    });

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: this.accessExpSeconds,
      refresh_token: refreshToken,
      refresh_expires_in: this.refreshExpSeconds,
      mustChangePassword: !user.passwordChangedAt,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        role: user.role,
        locationId: user.locationId,
      },
    };
  }

  /**
   * Làm mới phiên đăng nhập — Token Rotation.
   * 1. Verify chữ ký JWT của refresh token
   * 2. Kiểm tra token chưa bị thu hồi và chưa hết hạn trong DB
   * 3. Thu hồi refresh token cũ
   * 4. Cấp cặp access + refresh token mới
   *
   * @throws AUTH_REFRESH_INVALID (401) — Token sai, hết hạn, hoặc đã bị thu hồi
   */
  async refresh(refreshToken: string) {
    // Bước 1: Verify chữ ký JWT
    let payload: { sub: string; username: string; fullName?: string | null; phone?: string | null; email?: string | null; role: string; locationId?: string | null };
    try {
      payload = this.jwtService.verify(refreshToken, { secret: this.refreshSecret });
    } catch {
      throw new BusinessException('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 'AUTH_REFRESH_INVALID', HttpStatus.UNAUTHORIZED);
    }

    // Bước 2: Kiểm tra token còn hợp lệ trong DB
    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        token: hashedToken,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!storedToken) {
      throw new BusinessException('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 'AUTH_REFRESH_INVALID', HttpStatus.UNAUTHORIZED);
    }

    // Bước 3: Thu hồi refresh token cũ (token rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    // Bước 3b: Verify user is not soft-deleted
    const userRecord = await this.prisma.user.findUnique({
      where: { id: storedToken.userId },
      select: { id: true, deletedAt: true },
    });
    if (!userRecord || userRecord.deletedAt) {
      throw new BusinessException('Tài khoản không hợp lệ', 'AUTH_REFRESH_INVALID', HttpStatus.UNAUTHORIZED);
    }

    // Bước 4: Cấp cặp token mới
    const user = { id: payload.sub, username: payload.username, fullName: payload.fullName, phone: payload.phone, email: payload.email, role: payload.role, locationId: payload.locationId };
    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateRefreshToken(user);

    // Lưu hash refresh token mới vào DB, kế thừa deviceType
    const newHashedToken = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshExpDays);

    await this.prisma.refreshToken.create({
      data: {
        token: newHashedToken,
        userId: user.id,
        deviceType: storedToken.deviceType,
        expiresAt,
      },
    });

    return {
      access_token: newAccessToken,
      token_type: 'Bearer',
      expires_in: this.accessExpSeconds,
      refresh_token: newRefreshToken,
      refresh_expires_in: this.refreshExpSeconds,
    };
  }

  /**
   * Đăng xuất — thu hồi refresh token.
   * Luôn trả null (interceptor wrap thành { success: true, message, data: null }).
   */
  async logout(refreshToken: string) {
    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await this.prisma.refreshToken.updateMany({
      where: { token: hashedToken },
      data: { revoked: true },
    });
    return null;
  }

  /**
   * Send password reset email with 6-digit numeric token.
   * Always returns void — prevents email enumeration.
   * Token expires in 15 minutes.
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findFirst({ where: { email, deletedAt: null } });
    // Always return — do NOT reveal whether email exists
    if (!user) return;

    // Invalidate existing reset tokens for this user
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null, type: 'RESET' },
      data: { usedAt: new Date() },
    });

    // Generate 6-digit numeric token
    const rawToken = String(crypto.randomInt(100000, 999999));
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.prisma.passwordResetToken.create({
      data: {
        token: hashedToken,
        type: 'RESET',
        userId: user.id,
        expiresAt,
      },
    });

    if (this.emailService) {
      const baseUrl = this.config.get('APP_BASE_URL', 'http://localhost:3000');
      await this.emailService.sendPasswordResetEmail(
        user.email!,
        rawToken,
        user.username,
        `${baseUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email!)}`,
      );
    }
  }

  /**
   * Reset password using a valid 6-digit numeric token.
   * Token is single-use (marked as used after successful reset).
   */
  async resetPassword(token: string, email: string, newPassword: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        token: hashedToken,
        type: 'RESET',
        usedAt: null,
        expiresAt: { gt: new Date() },
        user: { email, deletedAt: null },
      },
    });

    if (!resetToken) {
      throw new BusinessException(
        'Mã khôi phục không hợp lệ hoặc đã hết hạn',
        AUTH_ERROR_CODES.INVALID_RESET_TOKEN,
        HttpStatus.BAD_REQUEST,
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword, passwordChangedAt: new Date() },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);
  }

  /**
   * Change password for authenticated user.
   * Validates current password before allowing change.
   * Sets passwordChangedAt to current timestamp.
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BusinessException('Không tìm thấy tài khoản', 'USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new BusinessException(
        'Mật khẩu hiện tại không đúng',
        'AUTH_INVALID_PASSWORD',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword, passwordChangedAt: new Date() },
    });
  }

  /**
   * Yêu cầu đổi email: Xác nhận mk, gửi OTP, đăng xuất.
   */
  async requestChangeEmail(userId: string, currentPassword: string, newEmail: string): Promise < void> {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if(!user) {
        throw new BusinessException('Không tìm thấy tài khoản', 'USER_NOT_FOUND', HttpStatus.NOT_FOUND);
      }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
      if(!isMatch) {
        throw new BusinessException(
          'Mật khẩu hiện tại không đúng',
          'AUTH_INVALID_PASSWORD',
          HttpStatus.UNAUTHORIZED,
        );
      }

    const existingEmail = await this.prisma.user.findFirst({ where: { email: newEmail, deletedAt: null } });
      if(existingEmail && existingEmail.id !== userId) {
      throw new BusinessException(
        'Email đã được sử dụng bởi tài khoản khác',
        'AUTH_EMAIL_TAKEN',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Huỷ các mã cũ
    await this.prisma.emailVerificationToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const rawToken = String(crypto.randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await this.prisma.emailVerificationToken.create({
      data: {
        token: rawToken,
        userId: user.id,
        newEmail,
        expiresAt,
      },
    });

    if (this.emailService && user.email) {
      await this.emailService.sendEmailChangeOtp(user.email, rawToken);
    }

    // Force logout (cấp Server-side)
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id, revoked: false },
      data: { revoked: true },
    });
  }

  /**
   * Cập nhật thông tin profile (Tên, SĐT).
   */
  async updateProfile(userId: string, fullName: string, phone?: string): Promise<{ access_token: string, refresh_token: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BusinessException('Không tìm thấy tài khoản', 'USER_NOT_FOUND', HttpStatus.NOT_FOUND);

    if (phone) {
      const existingPhone = await this.prisma.user.findFirst({ where: { phone, deletedAt: null } });
      if (existingPhone && existingPhone.id !== userId) {
        throw new BusinessException('Số điện thoại đã được đăng ký', 'AUTH_PHONE_TAKEN', HttpStatus.BAD_REQUEST);
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { fullName, phone: phone || null },
    });

    const payload = {
      username: updatedUser.username,
      sub: updatedUser.id,
      role: updatedUser.role,
      email: updatedUser.email,
      phone: updatedUser.phone,
      fullName: updatedUser.fullName,
      locationId: updatedUser.locationId,
    };

    const days = parseInt(this.config.get<string>('JWT_REFRESH_EXPIRATION_DAYS') || '7');
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: `${days}d`,
      }),
    ]);

    await this.prisma.refreshToken.create({
      data: {
        token: refresh_token,
        userId: user.id,
        deviceType: DEVICE_TYPES.WEB,
        expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      },
    });

    return { access_token, refresh_token };
  }

  /**
   * Xác nhận đổi email bằng OTP
   */
  async confirmChangeEmail(oldEmail: string, otp: string): Promise<void> {
    const user = await this.prisma.user.findFirst({ where: { email: oldEmail, deletedAt: null } });
    if (!user) throw new BusinessException('Không tìm thấy tài khoản', 'USER_NOT_FOUND', HttpStatus.NOT_FOUND);

    const checkToken = await this.prisma.emailVerificationToken.findFirst({
      where: {
        token: otp,
        userId: user.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!checkToken) {
      throw new BusinessException('Mã xác thực không hợp lệ hoặc đã hết hạn', 'AUTH_INVALID_OTP', HttpStatus.BAD_REQUEST);
    }

    if (!checkToken.newEmail) {
      throw new BusinessException('Lỗi dữ liệu hệ thống (thiếu newEmail)', 'AUTH_ERROR', HttpStatus.BAD_REQUEST);
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { email: checkToken.newEmail },
      }),
      this.prisma.emailVerificationToken.update({
        where: { id: checkToken.id },
        data: { usedAt: new Date() },
      }),
    ]);
  }

  /** Tạo access token JWT. Payload: { sub, username, email, role, locationId } */
  private generateAccessToken(user: { id: string; username: string; fullName?: string | null; phone?: string | null; email?: string | null; role: string; locationId?: string | null }) {
    return this.jwtService.sign(
      { sub: user.id, username: user.username, fullName: user.fullName, phone: user.phone, email: user.email, role: user.role, locationId: user.locationId },
    );
  }

  /**
   * Chuyển đổi chuỗi expiration (vd: '15m', '7d') sang giây.
   * Dùng để trả expires_in cho client.
   */
  private parseExpirationToSeconds(exp: string): number {
    const match = exp.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return 900;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 900;
    }
  }

  /** Tạo refresh token JWT. Dùng secret riêng, thời hạn dài hơn (7 ngày). */
  private generateRefreshToken(user: { id: string; username: string; fullName?: string | null; phone?: string | null; email?: string | null; role: string; locationId?: string | null }) {
    return this.jwtService.sign(
      { sub: user.id, username: user.username, fullName: user.fullName, phone: user.phone, email: user.email, role: user.role, locationId: user.locationId, jti: crypto.randomUUID() },
      { secret: this.refreshSecret, expiresIn: `${this.refreshExpDays}d` },
    );
  }
}
