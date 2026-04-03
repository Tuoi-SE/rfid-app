import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { QuerySessionsDto } from './dto/query-sessions.dto';
import { AssignSessionProductDto } from './dto/assign-session-product.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { PolicyDecorator } from '../casl/decorators/check-policies.decorator';
import { EventsGateway } from '../events/events.gateway';
import { ResponseMessageDecorator } from '@common/decorators/response-message.decorator';
import { AuthenticatedRequest } from '@common/interfaces/request.interface';

@Controller('api/sessions')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class SessionsController {
  constructor(
    private sessionsService: SessionsService,
    private eventsGateway: EventsGateway,
  ) {}

  /** GET /api/sessions — Danh sách phiên quét */
  @Get()
  @PolicyDecorator.check((ability) => ability.can('read', 'Session'))
  @ResponseMessageDecorator.withMessage('Lấy danh sách phiên quét thành công')
  findAll(@Query() query: QuerySessionsDto, @Request() req: AuthenticatedRequest) {
    return this.sessionsService.findAll(query, req.user);
  }

  /** POST /api/sessions — Tạo phiên quét mới */
  @Post()
  @PolicyDecorator.check((ability) => ability.can('create', 'Session'))
  @ResponseMessageDecorator.withMessage('Tạo phiên quét thành công')
  async create(@Request() req: AuthenticatedRequest, @Body() dto: CreateSessionDto) {
    const session = await this.sessionsService.create(dto, req.user.id);
    this.eventsGateway.emitSessionCreated(session);
    return session;
  }

  /** GET /api/sessions/:id — Chi tiết phiên quét */
  @Get(':id')
  @PolicyDecorator.check((ability) => ability.can('read', 'Session'))
  @ResponseMessageDecorator.withMessage('Lấy thông tin phiên quét thành công')
  findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }

  /** PATCH /api/sessions/:id/assign-product — Gán sản phẩm cho phiên quét trực tiếp */
  @Patch(':id/assign-product')
  @PolicyDecorator.check((ability) => ability.can('update', 'Session'))
  @ResponseMessageDecorator.withMessage('Gán sản phẩm cho phiên quét hàng loạt thành công')
  async assignProduct(@Param('id') id: string, @Body() dto: AssignSessionProductDto, @Request() req: AuthenticatedRequest) {
    const result = await this.sessionsService.assignProductToSession(id, dto.productId, req.user as any, dto.strategy);
    this.eventsGateway.emitTagsUpdated();
    return result;
  }
  /** DELETE /api/sessions/bulk — Xóa nhiều phiên quét */
  @Delete('bulk')
  @PolicyDecorator.check((ability) => ability.can('delete', 'Session'))
  @ResponseMessageDecorator.withMessage('Xóa danh sách phiên quét thành công')
  async removeBulk(@Body() dto: { ids: string[] }, @Request() req: AuthenticatedRequest) {
    return this.sessionsService.removeBulk(dto.ids, req.user as any);
  }

  /** DELETE /api/sessions/:id — Xóa phiên quét */
  @Delete(':id')
  @PolicyDecorator.check((ability) => ability.can('delete', 'Session'))
  @ResponseMessageDecorator.withMessage('Xóa phiên quét thành công')
  async remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.sessionsService.remove(id, req.user as any);
  }
}
