import {
  Controller, Post, Get, Body, Query, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { InventoryOperationDto } from './dto/inventory-operation.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/decorators/check-policies.decorator';
import { ResponseMessage } from '@common/decorators/response-message.decorator';

@ApiTags('Inventory')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('api/inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  /** POST /api/inventory — Nhập/Xuất kho hàng loạt (ADMIN) */
  @Post()
  @CheckPolicies((ability) => ability.can('create', 'Inventory'))
  @ApiOperation({ summary: 'Nhập kho / Xuất kho — thay đổi status tags hàng loạt' })
  @ResponseMessage('Thực hiện xuất/nhập kho thành công')
  processOperation(@Body() dto: InventoryOperationDto, @Req() req: any) {
    return this.inventoryService.processOperation(dto, req.user?.id);
  }

  /** GET /api/inventory/stock-summary — Báo cáo tồn kho */
  @Get('stock-summary')
  @CheckPolicies((ability) => ability.can('read', 'Inventory'))
  @ApiOperation({ summary: 'Tổng quan tồn kho theo trạng thái Tag' })
  @ResponseMessage('Lấy báo cáo tồn kho thành công')
  getStockSummary() {
    return this.inventoryService.getStockSummary();
  }

  /** GET /api/inventory/history — Lịch sử xuất nhập kho */
  @Get('history')
  @CheckPolicies((ability) => ability.can('read', 'Inventory'))
  @ApiOperation({ summary: 'Lịch sử nhập/xuất kho' })
  @ResponseMessage('Lấy lịch sử xuất/nhập kho thành công')
  getHistory(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.inventoryService.getHistory(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }
}
