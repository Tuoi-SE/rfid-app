import {
  Controller, Post, Get, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { InventoryOperationDto } from './dto/inventory-operation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Inventory')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('api/inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Post()
  @ApiOperation({ summary: 'Nhập kho / Xuất kho — thay đổi status tags hàng loạt' })
  processOperation(@Body() dto: InventoryOperationDto, @Request() req: any) {
    return this.inventoryService.processOperation(dto, req.user.id);
  }

  @Get('stock-summary')
  @ApiOperation({ summary: 'Tổng quan tồn kho theo trạng thái Tag' })
  getStockSummary() {
    return this.inventoryService.getStockSummary();
  }

  @Get('history')
  @ApiOperation({ summary: 'Lịch sử nhập/xuất kho' })
  getHistory(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.inventoryService.getHistory(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }
}
