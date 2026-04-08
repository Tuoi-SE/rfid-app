import { Injectable, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '@users/users.service';
import { PrismaService } from '@prisma/prisma.service';
import { BusinessException } from '@common/exceptions/business.exception';
import { ActivityLogService } from '../activity-log/activity-log.service';

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
    private config: ConfigService,
    private prisma: PrismaService,
    private activityLogService: ActivityLogService,
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
  async validateUser(username: string, password: string) {
    const user = await this.usersService.findByUsername(username);
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

    return { id: user.id, username: user.username, role: user.role, locationId: user.locationId };
  }

  /**
   * Đăng nhập — tạo cặp access + refresh token.
   * Lưu hash của refresh token vào bảng RefreshToken.
   * Interceptor sẽ auto-wrap thành { success, message, data }.
   */
  async login(user: { id: string; username: string; role: string; locationId?: string | null }, deviceType: string = 'WEB', ipAddress?: string) {
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
      user: {
        id: user.id,
        username: user.username,
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
    let payload: { sub: string; username: string; role: string; locationId?: string | null };
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
    const user = { id: payload.sub, username: payload.username, role: payload.role, locationId: payload.locationId };
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

  /** Tạo access token JWT. Payload: { sub, username, role, locationId } */
  private generateAccessToken(user: { id: string; username: string; role: string; locationId?: string | null }) {
    return this.jwtService.sign(
      { sub: user.id, username: user.username, role: user.role, locationId: user.locationId },
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
  private generateRefreshToken(user: { id: string; username: string; role: string; locationId?: string | null }) {
    return this.jwtService.sign(
      { sub: user.id, username: user.username, role: user.role, locationId: user.locationId, jti: crypto.randomUUID() },
      { secret: this.refreshSecret, expiresIn: `${this.refreshExpDays}d` },
    );
  }
}
