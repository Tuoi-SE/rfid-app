import {
  Controller, Post, Get, Body, Query, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { InventoryOperationDto } from './dto/inventory-operation.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { PolicyDecorator } from '../casl/decorators/check-policies.decorator';
import { ResponseMessageDecorator } from '@common/decorators/response-message.decorator';
import { AuthenticatedRequest } from '@common/interfaces/request.interface';

@ApiTags('Inventory')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('api/inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  /** POST /api/inventory — Nhập/Xuất kho hàng loạt (ADMIN) */
  @Post()
  @PolicyDecorator.check((ability) => ability.can('create', 'Inventory'))
  @ApiOperation({ summary: 'Nhập kho / Xuất kho — thay đổi status tags hàng loạt' })
  @ResponseMessageDecorator.withMessage('Thực hiện xuất/nhập kho thành công')
  processOperation(@Body() dto: InventoryOperationDto, @Req() req: AuthenticatedRequest) {
    return this.inventoryService.processOperation(dto, req.user?.id);
  }

  /** GET /api/inventory/stock-summary — Báo cáo tồn kho */
  @Get('stock-summary')
  @PolicyDecorator.check((ability) => ability.can('read', 'Inventory'))
  @ApiOperation({ summary: 'Tổng quan tồn kho theo trạng thái Tag' })
  @ResponseMessageDecorator.withMessage('Lấy báo cáo tồn kho thành công')
  getStockSummary() {
    return this.inventoryService.getStockSummary();
  }

  /** GET /api/inventory/history — Lịch sử xuất nhập kho */
  @Get('history')
  @PolicyDecorator.check((ability) => ability.can('read', 'Inventory'))
  @ApiOperation({ summary: 'Lịch sử nhập/xuất kho' })
  @ResponseMessageDecorator.withMessage('Lấy lịch sử xuất/nhập kho thành công')
  getHistory(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.inventoryService.getHistory(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }
}
