import { Module, Global } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { ActivityLogController } from './activity-log.controller';
import { ActivityLogInterceptor } from './activity-log.interceptor';

@Global()
@Module({
  providers: [ActivityLogService, ActivityLogInterceptor],
  controllers: [ActivityLogController],
  exports: [ActivityLogService, ActivityLogInterceptor],
})
export class ActivityLogModule {}
