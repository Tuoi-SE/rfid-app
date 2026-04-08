import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '@prisma/prisma.service';
import { BusinessException } from '@common/exceptions/business.exception';
import { Role } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;

  const mockUser = {
    id: 'user-1',
    username: 'testuser',
    password: '$2b$12$hashedpassword',
    role: Role.SUPER_ADMIN,
    locationId: 'loc-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    location: { id: 'loc-1', code: 'LOC-01', name: 'Location', type: 'ADMIN' },
    createdBy: { id: 'operator-1', username: 'operator' },
    updatedBy: null,
    deletedBy: null,
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    activityLog: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('findByUsername', () => {
    it('should return user when username exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      const result = await service.findByUsername('testuser');
      expect(result).toEqual(mockUser);
    });

    it('should return null when username does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      const result = await service.findByUsername('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return user when id exists', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      const result = await service.findById('user-1');
      expect(result).toBeDefined();
      expect(result.id).toBe('user-1');
    });

    it('should throw BusinessException with USER_NOT_FOUND when user not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      await expect(service.findById('invalid')).rejects.toThrow(BusinessException);
      await expect(service.findById('invalid')).rejects.toMatchObject({
        response: expect.objectContaining({ error: expect.objectContaining({ code: 'USER_NOT_FOUND' }) }),
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated users with default filters', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([mockUser]);
      mockPrismaService.user.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null }),
          orderBy: { createdAt: 'desc' },
          skip: 0,
          take: 20,
        }),
      );
    });

    it('should apply search filter', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20, search: 'admin' });

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ username: { contains: 'admin', mode: 'insensitive' }, deletedAt: null }),
        }),
      );
    });

    it('should apply role filter', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20, role: Role.ADMIN });

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ role: Role.ADMIN }),
        }),
      );
    });

    it('should include deleted users when include_deleted is true', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20, include_deleted: true });

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: undefined }),
        }),
      );
    });

    it('should return only deleted users when only_deleted is true', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([mockUser]);
      mockPrismaService.user.count.mockResolvedValue(1);

      await service.findAll({ page: 1, limit: 20, only_deleted: true });

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: { not: null } }),
        }),
      );
    });
  });

  describe('create', () => {
    it('should create user successfully', async () => {
      const createDto = { username: 'newuser', password: 'password123', role: Role.WAREHOUSE_MANAGER };
      const hashedUser = { ...mockUser, username: 'newuser' };
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(hashedUser);

      const result = await service.create(createDto, 'operator-1');

      expect(result.username).toBe('newuser');
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it('should throw BusinessException with USER_USERNAME_EXISTS when username already exists', async () => {
      const createDto = { username: 'existinguser', password: 'password123', role: Role.ADMIN };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.create(createDto)).rejects.toThrow(BusinessException);
      await expect(service.create(createDto)).rejects.toMatchObject({
        response: expect.objectContaining({ error: expect.objectContaining({ code: 'USER_USERNAME_EXISTS' }) }),
      });
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const updateDto = { username: 'updateduser' };
      const updatedUser = { ...mockUser, username: 'updateduser' };
      mockPrismaService.user.findFirst.mockResolvedValueOnce(mockUser); // findById check
      mockPrismaService.user.findFirst.mockResolvedValueOnce(null);     // username uniqueness check
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.update('user-1', updateDto);

      expect(result.username).toBe('updateduser');
      expect(mockPrismaService.user.update).toHaveBeenCalled();
    });

    it('should throw BusinessException with USER_NOT_FOUND when user not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.update('invalid', { username: 'newname' })).rejects.toThrow(BusinessException);
    });

    it('should throw BusinessException with USER_USERNAME_EXISTS when new username is taken', async () => {
      mockPrismaService.user.findFirst.mockResolvedValueOnce(mockUser); // findById check
      mockPrismaService.user.findFirst.mockResolvedValueOnce({ ...mockUser, id: 'other-user' }); // username conflict

      await expect(service.update('user-1', { username: 'takenname' })).rejects.toThrow(BusinessException);
    });
  });

  describe('remove', () => {
    it('should soft delete user successfully', async () => {
      const userWithoutTags = { ...mockUser, tags: [] };
      mockPrismaService.user.findFirst.mockResolvedValue(userWithoutTags);
      mockPrismaService.user.count.mockResolvedValue(2); // more than 1 SUPER_ADMIN exists
      mockPrismaService.user.update.mockResolvedValue({ ...mockUser, deletedAt: new Date() });

      const result = await service.remove('user-1', 'operator-1');

      expect(result.id).toBe('user-1');
      expect(result.deleted_at).toBeDefined();
    });

    it('should throw BusinessException with USER_NOT_FOUND when user not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.remove('invalid')).rejects.toThrow(BusinessException);
    });

    it('should throw BusinessException with USER_LAST_ADMIN_DELETE_FORBIDDEN when deleting last SUPER_ADMIN', async () => {
      const superAdminUser = { ...mockUser, role: Role.SUPER_ADMIN };
      mockPrismaService.user.findFirst.mockResolvedValue(superAdminUser);
      mockPrismaService.user.count.mockResolvedValue(1); // only 1 SUPER_ADMIN remaining

      await expect(service.remove('user-1')).rejects.toThrow(BusinessException);
      await expect(service.remove('user-1')).rejects.toMatchObject({
        response: expect.objectContaining({ error: expect.objectContaining({ code: 'USER_LAST_ADMIN_DELETE_FORBIDDEN' }) }),
      });
    });
  });

  describe('restore', () => {
    it('should restore deleted user successfully', async () => {
      const deletedUser = { ...mockUser, deletedAt: new Date(), deletedBy: { id: 'op', username: 'op' } };
      const restoredUser = { ...mockUser, deletedAt: null, deletedBy: null };
      mockPrismaService.user.findUnique.mockResolvedValue(deletedUser);
      mockPrismaService.user.update.mockResolvedValue(restoredUser);

      const result = await service.restore('user-1');

      expect(result).toBeDefined();
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({ deletedAt: null, deletedById: null }),
        select: expect.any(Object),
      });
    });

    it('should throw BusinessException with USER_NOT_FOUND when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.restore('invalid')).rejects.toThrow(BusinessException);
    });

    it('should throw BusinessException with USER_NOT_DELETED when user is not deleted', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.restore('user-1')).rejects.toThrow(BusinessException);
      await expect(service.restore('user-1')).rejects.toMatchObject({
        response: expect.objectContaining({ error: expect.objectContaining({ code: 'USER_NOT_DELETED' }) }),
      });
    });
  });
});
