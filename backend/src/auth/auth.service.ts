import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  private readonly refreshSecret: string;
  private readonly refreshExpDays: number;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.refreshSecret = this.config.get('JWT_REFRESH_SECRET', this.config.getOrThrow('JWT_SECRET') + '_refresh');
    this.refreshExpDays = Number(this.config.get('JWT_REFRESH_EXPIRATION_DAYS', '7'));
  }

  async validateUser(username: string, password: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    return { id: user.id, username: user.username, role: user.role };
  }

  async login(user: { id: string; username: string; role: string }) {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Store refresh token hash in DB
    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshExpDays);

    await this.prisma.refreshToken.create({
      data: {
        token: hashedToken,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    // Verify JWT signature
    let payload: { sub: string; username: string; role: string };
    try {
      payload = this.jwtService.verify(refreshToken, { secret: this.refreshSecret });
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }

    // Check if token exists in DB (not revoked)
    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        token: hashedToken,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token đã bị thu hồi hoặc hết hạn');
    }

    // Revoke old refresh token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    // Issue new token pair
    const user = { id: payload.sub, username: payload.username, role: payload.role };
    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateRefreshToken(user);

    // Store new refresh token
    const newHashedToken = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshExpDays);

    await this.prisma.refreshToken.create({
      data: {
        token: newHashedToken,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
  }

  async logout(refreshToken: string) {
    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await this.prisma.refreshToken.updateMany({
      where: { token: hashedToken },
      data: { revoked: true },
    });
    return { success: true };
  }

  private generateAccessToken(user: { id: string; username: string; role: string }) {
    return this.jwtService.sign(
      { sub: user.id, username: user.username, role: user.role },
    );
  }

  private generateRefreshToken(user: { id: string; username: string; role: string }) {
    return this.jwtService.sign(
      { sub: user.id, username: user.username, role: user.role },
      { secret: this.refreshSecret, expiresIn: `${this.refreshExpDays}d` },
    );
  }
}
