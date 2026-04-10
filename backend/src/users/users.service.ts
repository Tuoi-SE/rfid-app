import { Injectable, HttpStatus, Optional } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@prisma/prisma.service';
import { CreateUserDto } from '@users/dto/create-user.dto';
import { UpdateUserDto } from '@users/dto/update-user.dto';
import { QueryUsersDto } from '@users/dto/query-users.dto';
import { Role, Prisma } from '.prisma/client';
import { BusinessException } from '@common/exceptions/business.exception';
import { PaginationHelper } from '@common/helpers/pagination.helper';
import { plainToInstance } from 'class-transformer';
import { UserEntity } from './entities/user.entity';
import { EmailService } from '@common/email/email.service';

/** Số vòng bcrypt để hash password */
const SALT_ROUNDS = 12;

/** Select fields cho audit user (chỉ lấy id + username) */
const AUDIT_USER_SELECT = { id: true, username: true };

const USER_SELECT = {
  id: true,
  username: true,
  fullName: true,
  phone: true,
  email: true,
  role: true,
  locationId: true,
  location: { select: { id: true, code: true, name: true, type: true } },
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  createdBy: { select: AUDIT_USER_SELECT },
  updatedBy: { select: AUDIT_USER_SELECT },
  deletedBy: { select: AUDIT_USER_SELECT },
};

/**
 * UsersService — Xử lý logic quản lý người dùng.
 *
 * Chức năng:
 * - CRUD với audit tracking (created_by, updated_by, deleted_by)
 * - Soft delete + Restore
 * - Password hashing: bcrypt 12 rounds
 * - Response format: snake_case, dùng PaginationHelper.paginate() helper
 */
@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  /**
   * Lấy danh sách người dùng có phân trang và lọc.
   * Sử dụng PaginationHelper.paginate() helper cho format chuẩn.
   */
  async findAll(query: QueryUsersDto) {
    const { page = 1, limit = 20, search, role, include_deleted, only_deleted } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    // Lọc soft delete: only_deleted > include_deleted > mặc định (chỉ active)
    // QUAN TRỌNG: Phải luôn set where.deletedAt để bypass softDeleteExtension
    if (only_deleted) {
      where.deletedAt = { not: null };
    } else if (include_deleted) {
      // Trả tất cả — set deletedAt key rõ ràng để bypass soft-delete extension
      // Prisma: undefined value = bỏ qua filter = trả tất cả
      where.deletedAt = undefined as any;
    } else {
      where.deletedAt = null;
    }

    if (search) {
      where.username = { contains: search, mode: 'insensitive' };
    }
    if (role) {
      where.role = role;
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: USER_SELECT,
      }),
      this.prisma.user.count({ where }),
    ]);

    const formattedItems = items.map((u) => {
      return {
        id: u.id,
        username: u.username,
        full_name: u.fullName,
        phone: u.phone,
        email: u.email,
        role: u.role,
        locationId: u.locationId,
        location: u.location,
        created_at: u.createdAt,
        updated_at: u.updatedAt,
        deleted_at: u.deletedAt,
        created_by: u.createdBy ? { id: u.createdBy.id, username: u.createdBy.username } : null,
        updated_by: u.updatedBy ? { id: u.updatedBy.id, username: u.updatedBy.username } : null,
        deleted_by: u.deletedBy ? { id: u.deletedBy.id, username: u.deletedBy.username } : null,
      };
    });
    return PaginationHelper.paginate(formattedItems, total, page, limit);
  }

  /**
   * Tạo người dùng mới.
   * @throws USER_USERNAME_EXISTS (409)
   */
  async create(dto: CreateUserDto, operatorId?: string) {
    // Check username uniqueness
    const existing = await this.prisma.user.findFirst({ where: { username: dto.username, deletedAt: null } });
    if (existing) {
      throw new BusinessException('Tên đăng nhập đã tồn tại', 'USER_USERNAME_EXISTS', HttpStatus.CONFLICT);
    }

    // Check email uniqueness
    const existingEmail = await this.prisma.user.findFirst({ where: { email: dto.email, deletedAt: null } });
    if (existingEmail) {
      throw new BusinessException('Email đã được sử dụng bởi tài khoản khác', 'AUTH_EMAIL_ALREADY_EXISTS', HttpStatus.CONFLICT);
    }

    // Generate temp password if not provided
    let tempPassword = dto.password;
    if (!tempPassword) {
      tempPassword = this.generateTempPassword();
    }

    const hashedPassword = await bcrypt.hash(tempPassword, SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        fullName: (dto as any).fullName,
        phone: (dto as any).phone,
        email: dto.email,
        password: hashedPassword,
        role: (dto.role as Role) || Role.WAREHOUSE_MANAGER,
        locationId: dto.locationId || undefined,
        createdById: operatorId || undefined,
        updatedById: operatorId || undefined,
        passwordChangedAt: null, // null = first password (never changed by user)
      },
      select: USER_SELECT,
    });

    // Send welcome email (non-blocking — don't fail user creation if email fails)
    if (this.emailService && !dto.password) {
      const baseUrl = this.configService?.get('APP_BASE_URL', 'http://localhost:3000') || 'http://localhost:3000';
      this.emailService.sendWelcomeEmail(dto.email, dto.username, tempPassword, baseUrl).catch((err) => {
        console.error('Failed to send welcome email:', err);
      });
    }

    return plainToInstance(UserEntity, user);
  }

  /** Generate a secure temporary password: 12 chars, alphanumeric + special */
  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    const random = crypto.randomBytes(12);
    for (let i = 0; i < 12; i++) {
      password += chars[random[i] % chars.length];
    }
    return password;
  }

  /**
   * Tìm user theo username (dùng nội bộ cho auth, trả cả password hash).
   * KHÔNG dùng cho API response.
   */
  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username, deletedAt: null },
      select: {
        id: true,
        username: true,
        fullName: true,
        phone: true,
        email: true,
        password: true,
        role: true,
        locationId: true,
        deletedAt: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        passwordChangedAt: true,
      },
    });
  }

  /**
   * Lấy thông tin 1 user theo ID (chỉ user active).
   * @throws USER_NOT_FOUND (404)
   */
  async findById(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: USER_SELECT,
    });
    if (!user) {
      throw new BusinessException('Không tìm thấy người dùng', 'USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    return plainToInstance(UserEntity, user);
  }

  /**
   * Cập nhật thông tin user. Ghi nhận updated_by.
   * @throws USER_NOT_FOUND (404)
   * @throws USER_USERNAME_EXISTS (409)
   */
  async update(id: string, dto: UpdateUserDto, operatorId?: string) {
    await this.findById(id);

    if (dto.username) {
      const existing = await this.prisma.user.findFirst({
        where: { username: dto.username, NOT: { id } },
      });
      if (existing) {
        throw new BusinessException('Tên đăng nhập đã tồn tại', 'USER_USERNAME_EXISTS', HttpStatus.CONFLICT);
      }
    }

    const data: any = {};
    if (operatorId) data.updatedById = operatorId;
    if (dto.username) data.username = dto.username;
    if ((dto as any).fullName) data.fullName = (dto as any).fullName;
    if ((dto as any).phone) data.phone = (dto as any).phone;
    if (dto.email) data.email = dto.email;
    if (dto.role) data.role = dto.role;
    if (dto.locationId !== undefined) data.locationId = dto.locationId;
    if (dto.password) data.password = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: USER_SELECT,
    });

    return plainToInstance(UserEntity, user);
  }

  /**
   * Xóa mềm user. Bảo vệ admin cuối cùng.
   * @throws USER_NOT_FOUND (404)
   * @throws USER_LAST_ADMIN_DELETE_FORBIDDEN (400)
   */
  async remove(id: string, operatorId?: string) {
    const user = await this.findById(id);
    if (user.role === Role.SUPER_ADMIN) {
      const adminCount = await this.prisma.user.count({ where: { role: Role.SUPER_ADMIN, deletedAt: null } });
      if (adminCount <= 1) {
        throw new BusinessException('Không thể xóa admin cuối cùng', 'USER_LAST_ADMIN_DELETE_FORBIDDEN');
      }
    }

    const now = new Date();
    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: now,
        deletedById: operatorId || undefined,
      },
    });

    const deletedByUser = operatorId
      ? await this.prisma.user.findUnique({ where: { id: operatorId }, select: AUDIT_USER_SELECT })
      : null;

    return {
      id,
      deleted_at: now.toISOString(),
      deleted_by: deletedByUser,
    };
  }

  /**
   * Khôi phục user đã xóa mềm.
   * @throws USER_NOT_FOUND (404)
   * @throws USER_NOT_DELETED (400)
   */
  async restore(id: string, operatorId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, deletedAt: true },
    });

    if (!user) {
      throw new BusinessException('Không tìm thấy người dùng', 'USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    if (!user.deletedAt) {
      throw new BusinessException('Người dùng chưa bị xóa', 'USER_NOT_DELETED');
    }

    const restored = await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedById: null,
        ...(operatorId && { updatedById: operatorId }),
      },
      select: USER_SELECT,
    });

    return plainToInstance(UserEntity, restored);
  }

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsers, activeGroups, totalScans, failedLogins] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.activityLog.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: today } },
      }),
      this.prisma.scan.count({
        where: { scannedAt: { gte: today } },
      }),
      this.prisma.activityLog.count({
        where: {
          createdAt: { gte: today },
          action: 'LOGIN_FAILED',
        },
      }),
    ]);

    return {
      totalUsers,
      activeUsers: Math.max(activeGroups.length, 1), // Always at least 1 (the user making the request)
      totalScansToday: totalScans,
      securityStatus: failedLogins > 5 ? 'WARNING' : 'SAFE',
    };
  }
}
