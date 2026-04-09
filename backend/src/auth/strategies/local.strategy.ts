import { Injectable, HttpStatus } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '@auth/auth.service';
import { BusinessException } from '@common/exceptions/business.exception';

/**
 * LocalStrategy — Xác thực username/password qua Passport.
 * Được kích hoạt bởi @UseGuards(LocalAuthGuard).
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();
  }

  /** Validate và trả user info cho req.user */
  async validate(loginKey: string, password: string) {
    const user = await this.authService.validateUser(loginKey, password);
    if (!user) {
      throw new BusinessException('Sai tài khoản hoặc mật khẩu', 'AUTH_INVALID_CREDENTIALS', HttpStatus.UNAUTHORIZED);
    }
    return user;
  }
}
