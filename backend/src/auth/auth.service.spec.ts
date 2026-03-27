import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '@users/users.service';
import { PrismaService } from '@prisma/prisma.service';
import { BusinessException } from '@common/exceptions/business.exception';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let usersService: any;

  const mockUser = {
    id: 'user-1',
    username: 'admin',
    password: '', // Will be set in beforeAll
    role: 'ADMIN',
  };

  const mockPrisma = {
    refreshToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockUsersService = {
    findByUsername: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock.jwt.token'),
    verify: jest.fn(),
  };

  const mockConfig = {
    get: jest.fn((key: string, defaultVal?: any) => {
      const map: Record<string, any> = {
        JWT_SECRET: 'test-secret',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_REFRESH_EXPIRATION_DAYS: '7',
        JWT_ACCESS_EXPIRATION: '15m',
      };
      return map[key] ?? defaultVal;
    }),
    getOrThrow: jest.fn().mockReturnValue('test-secret'),
  };

  beforeAll(async () => {
    mockUser.password = await bcrypt.hash('admin123', 10);
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    usersService = module.get(UsersService);

    jest.clearAllMocks();
    // Re-apply mocks cleared by clearAllMocks
    mockJwtService.sign.mockReturnValue('mock.jwt.token');
    mockConfig.get.mockImplementation((key: string, defaultVal?: any) => {
      const map: Record<string, any> = {
        JWT_SECRET: 'test-secret',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_REFRESH_EXPIRATION_DAYS: '7',
        JWT_ACCESS_EXPIRATION: '15m',
      };
      return map[key] ?? defaultVal;
    });
    mockConfig.getOrThrow.mockReturnValue('test-secret');
  });

  describe('validateUser', () => {
    it('should return user info when credentials are valid', async () => {
      mockUsersService.findByUsername.mockResolvedValue(mockUser);

      const result = await service.validateUser('admin', 'admin123');

      expect(result).toEqual({
        id: 'user-1',
        username: 'admin',
        role: 'ADMIN',
      });
    });

    it('should return null when user not found', async () => {
      mockUsersService.findByUsername.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent', 'password');

      expect(result).toBeNull();
    });

    it('should return null when password is wrong', async () => {
      mockUsersService.findByUsername.mockResolvedValue(mockUser);

      const result = await service.validateUser('admin', 'wrong_password');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access_token + refresh_token pair', async () => {
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await service.login({
        id: 'user-1',
        username: 'admin',
        role: 'ADMIN',
      });

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result).toHaveProperty('token_type', 'Bearer');
      expect(result).toHaveProperty('expires_in');
      expect(result.user).toEqual({ id: 'user-1', username: 'admin', role: 'ADMIN' });
      expect(mockPrisma.refreshToken.create).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should rotate tokens successfully', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-1',
        username: 'admin',
        role: 'ADMIN',
      });
      mockPrisma.refreshToken.findFirst.mockResolvedValue({
        id: 'rt-1',
        revoked: false,
      });
      mockPrisma.refreshToken.update.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await service.refresh('valid.refresh.token');

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      // Old token should be revoked
      expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'rt-1' },
        data: { revoked: true },
      });
      // New token should be saved
      expect(mockPrisma.refreshToken.create).toHaveBeenCalled();
    });

    it('should throw when JWT verification fails', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      await expect(service.refresh('invalid.token'))
        .rejects
        .toThrow(BusinessException);
    });

    it('should throw when token is revoked or expired in DB', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-1',
        username: 'admin',
        role: 'ADMIN',
      });
      mockPrisma.refreshToken.findFirst.mockResolvedValue(null);

      await expect(service.refresh('revoked.token'))
        .rejects
        .toThrow(BusinessException);
    });
  });

  describe('logout', () => {
    it('should revoke refresh token', async () => {
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.logout('some.refresh.token');

      expect(result).toBeNull();
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalled();
    });
  });
});
