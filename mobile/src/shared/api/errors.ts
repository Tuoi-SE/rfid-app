export class ApiError extends Error {
  statusCode: number;
  data?: any;

  constructor(message: string, statusCode: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Lỗi kết nối mạng') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Hết phiên đăng nhập') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}
