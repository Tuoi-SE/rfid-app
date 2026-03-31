import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from '@users/users.service';
import { CreateUserDto } from '@users/dto/create-user.dto';
import { UpdateUserDto } from '@users/dto/update-user.dto';
import { QueryUsersDto } from '@users/dto/query-users.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { PolicyDecorator } from '../casl/decorators/check-policies.decorator';
import { ResponseMessageDecorator } from '@common/decorators/response-message.decorator';
import { AuthenticatedRequest } from '@common/interfaces/request.interface';

/**
 * UsersController — API quản lý người dùng (ADMIN only).
 *
 * Base path: /api/users
 * Bảo vệ: JwtAuthGuard + PoliciesGuard (manage User = chỉ ADMIN)
 */
@Controller('api/users')
@UseGuards(JwtAuthGuard, PoliciesGuard)
@PolicyDecorator.check((ability) => ability.can('manage', 'User'))
export class UsersController {
  constructor(private usersService: UsersService) {}

  /** GET /api/users — Danh sách có phân trang + lọc */
  @Get()
  @ResponseMessageDecorator.withMessage('Lấy danh sách người dùng thành công')
  findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  /** GET /api/users/dashboard-stats — Lấy thống kê cho dashboard */
  @Get('dashboard-stats')
  @ResponseMessageDecorator.withMessage('Lấy thống kê thành công')
  getDashboardStats() {
    return this.usersService.getDashboardStats();
  }

  /** GET /api/users/:id — Chi tiết 1 user */
  @Get(':id')
  @ResponseMessageDecorator.withMessage('Lấy thông tin người dùng thành công')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  /** POST /api/users — Tạo user mới */
  @Post()
  @ResponseMessageDecorator.withMessage('Tạo người dùng thành công')
  create(@Body() dto: CreateUserDto, @Request() req: AuthenticatedRequest) {
    return this.usersService.create(dto, req.user.id);
  }

  /** PATCH /api/users/:id — Cập nhật user */
  @Patch(':id')
  @ResponseMessageDecorator.withMessage('Cập nhật người dùng thành công')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @Request() req: AuthenticatedRequest) {
    return this.usersService.update(id, dto, req.user.id);
  }

  /** DELETE /api/users/:id — Xóa mềm user */
  @Delete(':id')
  @ResponseMessageDecorator.withMessage('Xóa người dùng thành công')
  remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.usersService.remove(id, req.user.id);
  }

  /** POST /api/users/:id/restore — Khôi phục user đã xóa mềm */
  @Post(':id/restore')
  @ResponseMessageDecorator.withMessage('Khôi phục người dùng thành công')
  restore(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.usersService.restore(id, req.user.id);
  }
}
