import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * GlobalExceptionFilter — Xử lý tất cả exceptions.
 *
 * Format chuẩn:
 * - BusinessException (có success: false) → trả nguyên
 * - ValidationPipe (400) → { success: false, message, error: { code: 'VALIDATION_ERROR' } }
 * - NestJS exceptions → { success: false, message, error: { code: 'HTTP_STATUS_CODE' } }
 * - Unknown errors → { success: false, message: 'Lỗi hệ thống', error: { code: 'INTERNAL_SERVER_ERROR' } }
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: any = {
      success: false,
      message: 'Lỗi hệ thống nội bộ',
      error: { code: 'INTERNAL_SERVER_ERROR', detail: exception instanceof Error ? exception.message : String(exception) },
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      // BusinessException đã có format chuẩn { success: false, message, error: { code } }
      if (typeof res === 'object' && (res as any).success === false) {
        body = res;
      } else if (typeof res === 'object' && Array.isArray((res as any).message)) {
        // ValidationPipe trả message dạng array
        body = {
          success: false,
          message: (res as any).message[0] || 'Dữ liệu không hợp lệ',
          error: {
            code: 'VALIDATION_ERROR',
            details: (res as any).message,
          },
        };
      } else {
        const message = typeof res === 'string' ? res : (res as any).message || 'Lỗi không xác định';
        body = {
          success: false,
          message,
          error: { code: this.getErrorCode(status) },
        };
      }
    }

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error('Unhandled Exception', exception instanceof Error ? exception.stack : exception);
    }

    response.status(status).json(body);
  }

  /** Map HTTP status → error code */
  private getErrorCode(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
    };
    return map[status] || 'INTERNAL_SERVER_ERROR';
  }
}
