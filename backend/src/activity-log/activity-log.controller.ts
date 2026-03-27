import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { QueryActivityLogDto } from './dto/query-activity-log.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/decorators/check-policies.decorator';
import { Role } from '.prisma/client';
import { ResponseMessage } from '@common/decorators/response-message.decorator';

@Controller('api/activity-logs')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class ActivityLogController {
  constructor(private activityLogService: ActivityLogService) {}

  @Get()
  @CheckPolicies((ability) => ability.can('read', 'ActivityLog'))
  @ResponseMessage('Lấy lịch sử hoạt động thành công')
  findAll(@Query() query: QueryActivityLogDto, @Request() req: any) {
    const isAdmin = req.user.role === Role.ADMIN;
    return this.activityLogService.findAll(query, req.user.id, isAdmin);
  }
}
