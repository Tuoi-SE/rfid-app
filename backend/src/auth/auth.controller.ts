import { Controller, Post, Get, Patch, UseGuards, Request, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from '@auth/auth.service';
import { DEVICE_TYPES } from '@common/constants/error-codes';
import { LocalAuthGuard } from '@auth/guards/local-auth.guard';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { LoginDto } from '@auth/dto/login.dto';
import { RefreshTokenDto } from '@auth/dto/refresh-token.dto';
import { ForgotPasswordDto } from '@auth/dto/forgot-password.dto';
import { ResetPasswordDto } from '@auth/dto/reset-password.dto';
import { ChangePasswordDto } from '@auth/dto/change-password.dto';
import { RequestChangeEmailDto, ConfirmChangeEmailDto } from '@auth/dto/change-email.dto';
import { UpdateProfileDto } from '@auth/dto/update-profile.dto';
import { ResponseMessageDecorator } from '@common/decorators/response-message.decorator';
import { AuthenticatedRequest } from '@common/interfaces/request.interface';

/**
 * AuthController — API xác thực người dùng.
 *
 * Base path: /api/auth
 *
 * Endpoints:
 * - POST /login     — Đăng nhập, trả access + refresh token
 * - GET  /me        — Lấy thông tin tài khoản hiện tại (cần Bearer token)
 * - POST /refresh   — Làm mới access token bằng refresh token
 * - POST /logout    — Đăng xuất, thu hồi refresh token
 */
@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /api/auth/login
   * @body { loginKey, password }
   * @returns { access_token, token_type, expires_in, refresh_token, refresh_expires_in, mustChangePassword, user }
   * @error AUTH_INVALID_CREDENTIALS (401)
   */
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ResponseMessageDecorator.withMessage('Đăng nhập thành công')
  login(@Request() req: AuthenticatedRequest & { ip?: string }, @Body() dto: LoginDto) {
    return this.authService.login(req.user, dto.deviceType || DEVICE_TYPES.WEB, req.ip);
  }

  /**
   * GET /api/auth/me
   * Yêu cầu header: Authorization: Bearer <access_token>
   * @returns { id, username, role }
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ResponseMessageDecorator.withMessage('Lấy thông tin tài khoản thành công')
  getMe(@Request() req: AuthenticatedRequest) {
    return req.user;
  }

  /**
   * POST /api/auth/refresh
   * @body { refresh_token }
   * @returns { access_token, token_type, expires_in, refresh_token, refresh_expires_in }
   * @error AUTH_REFRESH_INVALID (401)
   */
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('refresh')
  @ResponseMessageDecorator.withMessage('Làm mới phiên đăng nhập thành công')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refresh_token);
  }

  /**
   * POST /api/auth/logout
   * @body { refresh_token }
   * @returns null
   */
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('logout')
  @ResponseMessageDecorator.withMessage('Đăng xuất thành công')
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refresh_token);
  }

  /**
   * POST /api/auth/forgot-password
   * @body { email }
   * @returns 200 (always — prevents email enumeration)
   * @throttle 5/min per IP
   */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('forgot-password')
  @ResponseMessageDecorator.withMessage('Đã gửi email khôi phục mật khẩu')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return null;
  }

  /**
   * POST /api/auth/reset-password
   * @body { token, email, newPassword }
   * @returns 200
   * @error AUTH_INVALID_RESET_TOKEN (400)
   */
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('reset-password')
  @ResponseMessageDecorator.withMessage('Đặt lại mật khẩu thành công')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.email, dto.newPassword);
    return null;
  }

  /**
   * POST /api/auth/change-password
   * @body { currentPassword, newPassword }
   * @returns 200
   * @guard JwtAuthGuard (must be authenticated)
   * @error AUTH_INVALID_PASSWORD (401)
   */
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @ResponseMessageDecorator.withMessage('Đổi mật khẩu thành công')
  async changePassword(
    @Request() req: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(req.user.id, dto.currentPassword, dto.newPassword);
    return null;
  }

  /**
   * POST /api/auth/request-change-email
   * Yêu cầu đổi email. Gửi OTP về mail cũ và đăng xuất.
   */
  @UseGuards(JwtAuthGuard)
  @Post('request-change-email')
  @ResponseMessageDecorator.withMessage('Đã gửi mã OTP. Vui lòng kiểm tra email của bạn.')
  async requestChangeEmail(
    @Request() req: AuthenticatedRequest,
    @Body() dto: RequestChangeEmailDto,
  ) {
    await this.authService.requestChangeEmail(req.user.id, dto.currentPassword, dto.newEmail);
    return null;
  }

  /**
   * POST /api/auth/confirm-change-email
   * Không yêu cầu JWT (vì User đã bị force logout ở bước 1)
   */
  @Post('confirm-change-email')
  @ResponseMessageDecorator.withMessage('Đổi email thành công, vui lòng đăng nhập lại')
  async confirmChangeEmail(
    @Body() dto: ConfirmChangeEmailDto,
  ) {
    await this.authService.confirmChangeEmail(dto.oldEmail, dto.otp);
    return null;
  }

  /**
   * PATCH /api/auth/update-profile
   * Cập nhật thông tin cơ bản: Tên, SĐT
   */
  @UseGuards(JwtAuthGuard)
  @Patch('update-profile')
  @ResponseMessageDecorator.withMessage('Cập nhật thông tin thành công')
  async updateProfile(@Request() req: AuthenticatedRequest, @Body() dto: UpdateProfileDto) {
    return await this.authService.updateProfile(req.user.id, dto.fullName, dto.phone);
  }
}
