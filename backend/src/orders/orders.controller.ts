import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/decorators/check-policies.decorator';
import { ResponseMessage } from '@common/decorators/response-message.decorator';
import { AuthenticatedRequest } from '@common/interfaces/request.interface';

@Controller('api/orders')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /** POST /api/orders — Tạo đơn hàng mới (ADMIN) */
  @Post()
  @CheckPolicies((ability) => ability.can('create', 'Order'))
  @ResponseMessage('Tạo đơn hàng thành công')
  create(@Body() createOrderDto: CreateOrderDto, @Req() req: AuthenticatedRequest) {
    return this.ordersService.create(createOrderDto, req.user?.id);
  }

  /** GET /api/orders — Lấy danh sách đơn hàng (có phân trang) */
  @Get()
  @CheckPolicies((ability) => ability.can('read', 'Order'))
  @ResponseMessage('Lấy danh sách đơn hàng thành công')
  findAll(@Query() query: QueryOrdersDto) {
    return this.ordersService.findAll(query);
  }

  /** GET /api/orders/:id — Xem chi tiết đơn hàng */
  @Get(':id')
  @CheckPolicies((ability) => ability.can('read', 'Order'))
  @ResponseMessage('Lấy chi tiết đơn hàng thành công')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  /** PATCH /api/orders/:id/cancel — Hủy đơn hàng (ADMIN) */
  @Patch(':id/cancel')
  @CheckPolicies((ability) => ability.can('update', 'Order'))
  @ResponseMessage('Hủy đơn hàng thành công')
  cancelOrder(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.ordersService.cancelOrder(id, req.user?.id);
  }

  /** DELETE /api/orders/:id — Xóa đơn hàng (Soft Delete, ADMIN) */
  @Delete(':id')
  @CheckPolicies((ability) => ability.can('delete', 'Order'))
  @ResponseMessage('Xóa đơn hàng thành công')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.ordersService.remove(id, req.user?.id);
  }
}
