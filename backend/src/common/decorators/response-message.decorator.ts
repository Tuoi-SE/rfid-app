import { SetMetadata } from '@nestjs/common';

/**
 * RESPONSE_MESSAGE — Key dùng để lưu custom message vào metadata.
 */
export const RESPONSE_MESSAGE_KEY = 'response_message';

/**
 * @ResponseMessage — Decorator custom message cho success response.
 *
 * Dùng trên controller method để interceptor tự động wrap:
 * { success: true, message: '<custom message>', data: <return value> }
 *
 * Nếu không dùng decorator này, message mặc định là 'Thành công'.
 *
 * @example
 * @Get()
 * @ResponseMessage('Lấy danh sách người dùng thành công')
 * findAll() { return this.service.findAll(); }
 */
export const ResponseMessage = (message: string) =>
  SetMetadata(RESPONSE_MESSAGE_KEY, message);
