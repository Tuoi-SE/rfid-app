import { Controller, Get, Post, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { QuerySessionsDto } from './dto/query-sessions.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/decorators/check-policies.decorator';
import { EventsGateway } from '../events/events.gateway';
import { ResponseMessage } from '@common/decorators/response-message.decorator';

@Controller('api/sessions')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class SessionsController {
  constructor(
    private sessionsService: SessionsService,
    private eventsGateway: EventsGateway,
  ) {}

  /** GET /api/sessions — Danh sách phiên quét */
  @Get()
  @CheckPolicies((ability) => ability.can('read', 'Session'))
  @ResponseMessage('Lấy danh sách phiên quét thành công')
  findAll(@Query() query: QuerySessionsDto) {
    return this.sessionsService.findAll(query);
  }

  /** POST /api/sessions — Tạo phiên quét mới */
  @Post()
  @CheckPolicies((ability) => ability.can('create', 'Session'))
  @ResponseMessage('Tạo phiên quét thành công')
  async create(@Request() req: any, @Body() dto: CreateSessionDto) {
    const session = await this.sessionsService.create(dto, req.user.id);
    this.eventsGateway.emitSessionCreated(session);
    return session;
  }

  /** GET /api/sessions/:id — Chi tiết phiên quét */
  @Get(':id')
  @CheckPolicies((ability) => ability.can('read', 'Session'))
  @ResponseMessage('Lấy thông tin phiên quét thành công')
  findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }
}
