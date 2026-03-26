import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { QueryActivityLogDto } from './dto/query-activity-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Role } from '.prisma/client';

@Controller('api/activity-logs')
@UseGuards(JwtAuthGuard)
export class ActivityLogController {
  constructor(private activityLogService: ActivityLogService) {}

  @Get()
  findAll(@Query() query: QueryActivityLogDto, @Request() req: any) {
    const isAdmin = req.user.role === Role.ADMIN;
    return this.activityLogService.findAll(query, req.user.id, isAdmin);
  }
}
