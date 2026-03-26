import { Module } from '@nestjs/common';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule],
  providers: [TagsService],
  controllers: [TagsController],
})
export class TagsModule {}
