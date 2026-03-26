import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { AssignTagsDto } from './dto/bulk-update.dto';
import { LiveScanDto } from './dto/live-scan.dto';
import { QueryTagsDto } from './dto/query-tags.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Role } from '.prisma/client';
import { EventsGateway } from '../events/events.gateway';
import { Request } from 'express';

@Controller('api/tags')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TagsController {
  constructor(
    private tagsService: TagsService,
    private eventsGateway: EventsGateway,
  ) { }

  @Get()
  @Public()
  findAll(@Query() query: QueryTagsDto) {
    return this.tagsService.findAll(query);
  }

  @Get(':epc')
  findByEpc(@Param('epc') epc: string) {
    return this.tagsService.findByEpc(epc);
  }

  @Get(':epc/history')
  getHistory(@Param('epc') epc: string) {
    return this.tagsService.getHistory(epc);
  }

  @Post()
  async create(@Body() dto: CreateTagDto, @Req() req: any) {
    const userId = req.user?.id;
    const tag = await this.tagsService.create(dto, userId);
    this.eventsGateway.emitTagsUpdated();
    return tag;
  }

  @Patch('assign')
  async assignTags(@Body() dto: AssignTagsDto, @Req() req: any) {
    const userId = req.user?.id;
    const result = await this.tagsService.assignTags(dto, userId);
    this.eventsGateway.emitTagsUpdated();
    return result;
  }

  @Post('live')
  @Public()
  liveScan(@Body() dto: LiveScanDto) {
    this.eventsGateway.emitLiveScan(dto.scans);
    return { success: true, count: dto.scans.length };
  }

  @Patch(':epc')
  async update(@Param('epc') epc: string, @Body() dto: UpdateTagDto, @Req() req: any) {
    const userId = req.user?.id;
    const tag = await this.tagsService.update(epc, dto, userId);
    this.eventsGateway.emitTagsUpdated();
    return tag;
  }

  @Delete(':epc')
  @Roles(Role.ADMIN)
  async remove(@Param('epc') epc: string) {
    const result = await this.tagsService.remove(epc);
    this.eventsGateway.emitTagsUpdated();
    return result;
  }
}
