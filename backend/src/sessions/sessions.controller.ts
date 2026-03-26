import { Controller, Get, Post, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { QuerySessionsDto } from './dto/query-sessions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { EventsGateway } from '../events/events.gateway';

@Controller('api/sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(
    private sessionsService: SessionsService,
    private eventsGateway: EventsGateway,
  ) {}

  @Get()
  findAll(@Query() query: QuerySessionsDto) {
    return this.sessionsService.findAll(query);
  }

  @Post()
  async create(@Request() req: any, @Body() dto: CreateSessionDto) {
    const session = await this.sessionsService.create(dto, req.user.id);
    this.eventsGateway.emitSessionCreated(session);
    return session;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }
}
