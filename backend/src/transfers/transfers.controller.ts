import { Controller, Get, Post, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { ConfirmTransferDto } from './dto/confirm-transfer.dto';
import { QueryTransfersDto } from './dto/query-transfers.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('transfers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateTransferDto, @Request() req) {
    return this.transfersService.create(dto, req.user.id);
  }

  @Post(':id/confirm')
  @Roles(Role.WAREHOUSE_MANAGER)
  confirm(@Param('id') id: string, @Body() dto: ConfirmTransferDto, @Request() req) {
    return this.transfersService.confirm(id, dto, req.user.id);
  }

  @Post(':id/cancel')
  @Roles(Role.ADMIN)
  cancel(@Param('id') id: string, @Request() req) {
    return this.transfersService.cancel(id, req.user.id);
  }

  @Get()
  findAll(@Query() query: QueryTransfersDto) {
    return this.transfersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transfersService.findOne(id);
  }
}
