import { Role } from '.prisma/client';

/**
 * Typed Request object sau khi đi qua JwtAuthGuard.
 * Thay thế `req: any` trong tất cả controllers.
 */
export interface AuthenticatedRequest {
  user: {
    id: string;
    username: string;
    role: Role;
  };
}
