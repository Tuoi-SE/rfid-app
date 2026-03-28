import { Controller, Post, Get, UseGuards, Request, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from '@auth/auth.service';
import { LocalAuthGuard } from '@auth/guards/local-auth.guard';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { LoginDto } from '@auth/dto/login.dto';
import { RefreshTokenDto } from '@auth/dto/refresh-token.dto';
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
   * @body { username, password }
   * @returns { access_token, token_type, expires_in, refresh_token, refresh_expires_in, user }
   * @error AUTH_INVALID_CREDENTIALS (401)
   */
  @Throttle({ default: { limit: 5, ttl: 1000 } })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ResponseMessageDecorator.withMessage('Đăng nhập thành công')
  login(@Request() req: AuthenticatedRequest, @Body() _dto: LoginDto) {
    return this.authService.login(req.user);
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
  @Post('logout')
  @ResponseMessageDecorator.withMessage('Đăng xuất thành công')
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refresh_token);
  }
}
