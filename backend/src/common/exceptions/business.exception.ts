import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * BusinessException — Helper tạo error response chuẩn.
 *
 * Tự động format thành:
 * {
 *   "success": false,
 *   "message": "...",
 *   "error": { "code": "ERROR_CODE" }
 * }
 *
 * @example
 * throw new BusinessException('Tên đăng nhập đã tồn tại', 'USER_USERNAME_EXISTS', HttpStatus.CONFLICT);
 * throw new BusinessException('Không tìm thấy', 'NOT_FOUND', 404);
 */
export class BusinessException extends HttpException {
  constructor(message: string, code: string, status: HttpStatus | number = HttpStatus.BAD_REQUEST) {
    super(
      {
        success: false,
        message,
        error: { code },
      },
      status,
    );
  }
}
