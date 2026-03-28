import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { PolicyDecorator } from '../casl/decorators/check-policies.decorator';
import { ResponseMessageDecorator } from '@common/decorators/response-message.decorator';

@Controller('api/dashboard')
@UseGuards(JwtAuthGuard, PoliciesGuard)
@PolicyDecorator.check((ability) => ability.can('read', 'Dashboard'))
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('summary')
  @ResponseMessageDecorator.withMessage('Lấy thông tin tổng quan Dashboard thành công')
  getSummary() {
    return this.dashboardService.getSummary();
  }
}
