import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { PolicyDecorator } from '../casl/decorators/check-policies.decorator';
import { ResponseMessageDecorator } from '@common/decorators/response-message.decorator';
import { AuthenticatedRequest } from '@common/interfaces/request.interface';

@Controller('api/orders')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /** POST /api/orders — Tạo đơn hàng mới (ADMIN) */
  @Post()
  @PolicyDecorator.check((ability) => ability.can('create', 'Order'))
  @ResponseMessageDecorator.withMessage('Tạo đơn hàng thành công')
  create(@Body() createOrderDto: CreateOrderDto, @Req() req: AuthenticatedRequest) {
    return this.ordersService.create(createOrderDto, req.user as any);
  }

  /** GET /api/orders — Lấy danh sách đơn hàng (có phân trang) */
  @Get()
  @PolicyDecorator.check((ability) => ability.can('read', 'Order'))
  @ResponseMessageDecorator.withMessage('Lấy danh sách đơn hàng thành công')
  findAll(@Query() query: QueryOrdersDto, @Req() req: AuthenticatedRequest) {
    return this.ordersService.findAll(query, req.user as any);
  }

  /** GET /api/orders/:id — Xem chi tiết đơn hàng */
  @Get(':id')
  @PolicyDecorator.check((ability) => ability.can('read', 'Order'))
  @ResponseMessageDecorator.withMessage('Lấy chi tiết đơn hàng thành công')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.ordersService.findOne(id, req.user as any);
  }

  /** PATCH /api/orders/:id — Cập nhật đơn hàng (ADMIN) */
  @Patch(':id')
  @PolicyDecorator.check((ability) => ability.can('update', 'Order'))
  @ResponseMessageDecorator.withMessage('Cập nhật đơn hàng thành công')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto, @Req() req: AuthenticatedRequest) {
    return this.ordersService.update(id, updateOrderDto, req.user as any);
  }

  /** PATCH /api/orders/:id/cancel — Hủy đơn hàng (ADMIN) */
  @Patch(':id/cancel')
  @PolicyDecorator.check((ability) => ability.can('update', 'Order'))
  @ResponseMessageDecorator.withMessage('Hủy đơn hàng thành công')
  cancelOrder(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.ordersService.cancelOrder(id, req.user as any);
  }

  /** DELETE /api/orders/:id — Xóa đơn hàng (Soft Delete, ADMIN) */
  @Delete(':id')
  @PolicyDecorator.check((ability) => ability.can('delete', 'Order'))
  @ResponseMessageDecorator.withMessage('Xóa đơn hàng thành công')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.ordersService.remove(id, req.user as any);
  }
}
