import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/decorators/check-policies.decorator';
import { ResponseMessage } from '@common/decorators/response-message.decorator';

@Controller('api/dashboard')
@UseGuards(JwtAuthGuard, PoliciesGuard)
@CheckPolicies((ability) => ability.can('read', 'Dashboard'))
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('summary')
  @ResponseMessage('Lấy thông tin tổng quan Dashboard thành công')
  getSummary() {
    return this.dashboardService.getSummary();
  }
}
