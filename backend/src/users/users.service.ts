import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { Role, Prisma } from '.prisma/client';

const SALT_ROUNDS = 10;
const USER_SELECT = { id: true, username: true, role: true, createdAt: true, updatedAt: true };

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryUsersDto) {
    const { page = 1, limit = 20, search, role } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};
    if (search) {
      where.username = { contains: search, mode: 'insensitive' };
    }
    if (role) {
      where.role = role;
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: USER_SELECT,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (existing) throw new ConflictException(`Username "${dto.username}" đã tồn tại`);

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
    return this.prisma.user.create({
      data: {
        username: dto.username,
        password: hashedPassword,
        role: (dto.role as Role) || Role.WAREHOUSE_MANAGER,
      },
      select: USER_SELECT,
    });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException(`Không tìm thấy user với ID "${id}"`);
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findById(id);

    if (dto.username) {
      const existing = await this.prisma.user.findFirst({
        where: { username: dto.username, NOT: { id } },
      });
      if (existing) throw new ConflictException(`Username "${dto.username}" đã tồn tại`);
    }

    const data: Prisma.UserUpdateInput = {};
    if (dto.username) data.username = dto.username;
    if (dto.role) data.role = dto.role;
    if (dto.password) data.password = await bcrypt.hash(dto.password, SALT_ROUNDS);

    return this.prisma.user.update({
      where: { id },
      data,
      select: USER_SELECT,
    });
  }

  async remove(id: string) {
    const user = await this.findById(id);
    if (user.role === Role.ADMIN) {
      const adminCount = await this.prisma.user.count({ where: { role: Role.ADMIN } });
      if (adminCount <= 1) throw new BadRequestException('Không thể xóa admin cuối cùng');
    }
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }
}
