import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE_KEY } from '@common/decorators/response-message.decorator';

/**
 * ResponseInterceptor — Auto-wrap tất cả response thành format chuẩn:
 *
 * {
 *   "success": true,
 *   "message": "...",     ← từ @ResponseMessage() decorator hoặc mặc định "Thành công"
 *   "data": ...           ← return value của controller method
 * }
 *
 * SKIP wrap nếu controller đã tự trả object có field "success"
 * (tránh wrap 2 lần cho auth.service.login() đang trả trực tiếp).
 *
 * Đăng ký global trong main.ts:
 *   app.useGlobalInterceptors(new ResponseInterceptor(new Reflector()));
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const message =
      this.reflector.get<string>(RESPONSE_MESSAGE_KEY, context.getHandler()) || 'Thành công';

    return next.handle().pipe(
      map((data) => {
        // Nếu controller đã tự wrap { success, ... } → trả nguyên
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        return {
          success: true,
          message,
          data: data ?? null,
        };
      }),
    );
  }
}
