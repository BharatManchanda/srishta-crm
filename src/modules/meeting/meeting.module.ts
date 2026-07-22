import { Module } from '@nestjs/common';
import { MeetingService } from './meeting.service';
import { MeetingController } from './meeting.controller';
import { JwtModule } from '../jwt/jwt.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { MeetingFilterBuilder } from './meeting-filter.builder';
import { MeetingPolicy } from './meeting.policy';
import { ActivityModule } from '../activity/activity.module';
import { GoogleCalendarModule } from '../google-calendar/google-calendar.module';
import { UserPolicy } from '../user/user.policy';
import { AiModule } from '../ai/ai.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, JwtModule, ActivityModule, GoogleCalendarModule, AiModule, EmailModule],
  providers: [
    MeetingService,
    PaginationService,
    UserHierarchyService,
    MeetingFilterBuilder,
    MeetingPolicy,
    UserPolicy,
  ],
  controllers: [MeetingController],
})
export class MeetingModule {}
