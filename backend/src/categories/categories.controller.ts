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
import { CategoriesService } from '@categories/categories.service';
import { CreateCategoryDto } from '@categories/dto/create-category.dto';
import { UpdateCategoryDto } from '@categories/dto/update-category.dto';
import { QueryCategoriesDto } from '@categories/dto/query-categories.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { PolicyDecorator } from '../casl/decorators/check-policies.decorator';
import { ResponseMessageDecorator } from '@common/decorators/response-message.decorator';
import { AuthenticatedRequest } from '@common/interfaces/request.interface';

/**
 * CategoriesController — API quản lý danh mục sản phẩm.
 *
 * Base path: /api/categories
 * GET: tất cả user đã đăng nhập (read Category)
 * POST/PATCH/DELETE/RESTORE: chỉ ADMIN (manage Category)
 */
@Controller('api/categories')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  /** GET /api/categories — Danh sách có phân trang */
  @Get()
  @PolicyDecorator.check((ability) => ability.can('read', 'Category'))
  @ResponseMessageDecorator.withMessage('Lấy danh sách danh mục thành công')
  findAll(@Query() query: QueryCategoriesDto) {
    return this.categoriesService.findAll(query);
  }

  /** GET /api/categories/stats — Các thông số thống kê Dashboard */
  @Get('stats')
  @PolicyDecorator.check((ability) => ability.can('read', 'Category'))
  @ResponseMessageDecorator.withMessage('Lấy thống kê danh mục thành công')
  getStats() {
    return this.categoriesService.getStats();
  }

  /** GET /api/categories/:id — Chi tiết danh mục */
  @Get(':id')
  @PolicyDecorator.check((ability) => ability.can('read', 'Category'))
  @ResponseMessageDecorator.withMessage('Lấy thông tin danh mục thành công')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  /** POST /api/categories — Tạo danh mục mới (ADMIN) */
  @Post()
  @PolicyDecorator.check((ability) => ability.can('create', 'Category'))
  @ResponseMessageDecorator.withMessage('Tạo danh mục thành công')
  create(@Body() dto: CreateCategoryDto, @Request() req: AuthenticatedRequest) {
    return this.categoriesService.create(dto, req.user.id);
  }

  /** PATCH /api/categories/:id — Cập nhật danh mục (ADMIN) */
  @Patch(':id')
  @PolicyDecorator.check((ability) => ability.can('update', 'Category'))
  @ResponseMessageDecorator.withMessage('Cập nhật danh mục thành công')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto, @Request() req: AuthenticatedRequest) {
    return this.categoriesService.update(id, dto, req.user.id);
  }

  /** DELETE /api/categories/:id — Xóa mềm danh mục (ADMIN) */
  @Delete(':id')
  @PolicyDecorator.check((ability) => ability.can('delete', 'Category'))
  @ResponseMessageDecorator.withMessage('Xóa danh mục thành công')
  remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.categoriesService.remove(id, req.user.id);
  }

  /** POST /api/categories/:id/restore — Khôi phục danh mục đã xóa (ADMIN) */
  @Post(':id/restore')
  @PolicyDecorator.check((ability) => ability.can('update', 'Category'))
  @ResponseMessageDecorator.withMessage('Khôi phục danh mục thành công')
  restore(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.categoriesService.restore(id, req.user.id);
  }
}
