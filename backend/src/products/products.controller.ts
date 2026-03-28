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
import { ProductsService } from '@products/products.service';
import { CreateProductDto } from '@products/dto/create-product.dto';
import { UpdateProductDto } from '@products/dto/update-product.dto';
import { QueryProductsDto } from '@products/dto/query-products.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { PolicyDecorator } from '../casl/decorators/check-policies.decorator';
import { ResponseMessageDecorator } from '@common/decorators/response-message.decorator';
import { AuthenticatedRequest } from '@common/interfaces/request.interface';

/**
 * ProductsController — API quản lý sản phẩm.
 *
 * Base path: /api/products
 * GET: tất cả user đã đăng nhập (read Product)
 * POST/PATCH/DELETE/RESTORE: chỉ ADMIN (manage Product)
 */
@Controller('api/products')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  /** GET /api/products — Danh sách có phân trang + lọc category */
  @Get()
  @PolicyDecorator.check((ability) => ability.can('read', 'Product'))
  @ResponseMessageDecorator.withMessage('Lấy danh sách sản phẩm thành công')
  findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findAll(query);
  }

  /** GET /api/products/:id — Chi tiết sản phẩm */
  @Get(':id')
  @PolicyDecorator.check((ability) => ability.can('read', 'Product'))
  @ResponseMessageDecorator.withMessage('Lấy thông tin sản phẩm thành công')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  /** POST /api/products — Tạo sản phẩm mới (ADMIN) */
  @Post()
  @PolicyDecorator.check((ability) => ability.can('create', 'Product'))
  @ResponseMessageDecorator.withMessage('Tạo sản phẩm thành công')
  create(@Body() dto: CreateProductDto, @Request() req: AuthenticatedRequest) {
    return this.productsService.create(dto, req.user.id);
  }

  /** PATCH /api/products/:id — Cập nhật sản phẩm (ADMIN) */
  @Patch(':id')
  @PolicyDecorator.check((ability) => ability.can('update', 'Product'))
  @ResponseMessageDecorator.withMessage('Cập nhật sản phẩm thành công')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto, @Request() req: AuthenticatedRequest) {
    return this.productsService.update(id, dto, req.user.id);
  }

  /** DELETE /api/products/:id — Xóa mềm sản phẩm (ADMIN) */
  @Delete(':id')
  @PolicyDecorator.check((ability) => ability.can('delete', 'Product'))
  @ResponseMessageDecorator.withMessage('Xóa sản phẩm thành công')
  remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.productsService.remove(id, req.user.id);
  }

  /** POST /api/products/:id/restore — Khôi phục sản phẩm đã xóa (ADMIN) */
  @Post(':id/restore')
  @PolicyDecorator.check((ability) => ability.can('update', 'Product'))
  @ResponseMessageDecorator.withMessage('Khôi phục sản phẩm thành công')
  restore(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.productsService.restore(id, req.user.id);
  }
}
