import { Module } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule],
  providers: [SessionsService],
  controllers: [SessionsController],
})
export class SessionsModule {}
