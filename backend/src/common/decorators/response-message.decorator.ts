import { SetMetadata } from '@nestjs/common';

/**
 * RESPONSE_MESSAGE — Key dùng để lưu custom message vào metadata.
 */
export const RESPONSE_MESSAGE_KEY = 'response_message';

/**
 * @ResponseMessageDecorator.withMessage — Decorator custom message cho success response.
 *
 * Dùng trên controller method để interceptor tự động wrap:
 * { success: true, message: '<custom message>', data: <return value> }
 *
 * Nếu không dùng decorator này, message mặc định là 'Thành công'.
 *
 * @example
 * @Get()
 * @ResponseMessageDecorator.withMessage('Lấy danh sách người dùng thành công')
 * findAll() { return this.service.findAll(); }
 */
export class ResponseMessageDecorator {
  static readonly KEY = RESPONSE_MESSAGE_KEY;

  static withMessage(message: string) {
    return SetMetadata(ResponseMessageDecorator.KEY, message);
  }
}
