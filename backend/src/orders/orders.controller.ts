import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles('ADMIN', 'WAREHOUSE_MANAGER')
  create(@Body() createOrderDto: CreateOrderDto, @Req() req: any) {
    return this.ordersService.create(createOrderDto, req.user.id);
  }

  @Get()
  @Roles('ADMIN', 'WAREHOUSE_MANAGER')
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'WAREHOUSE_MANAGER')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }
}
