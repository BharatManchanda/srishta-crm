import { Module } from '@nestjs/common';
import { CallService } from './call.service';
import { CallController } from './call.controller';
import { JwtModule } from '../jwt/jwt.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { CallFilterBuilder } from './call-filter.builder';
import { CallPolicy } from './call.policy';
import { ActivityModule } from '../activity/activity.module';
import { GoogleCalendarModule } from '../google-calendar/google-calendar.module';
import { UserPolicy } from '../user/user.policy';
import { AiModule } from '../ai/ai.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, JwtModule, ActivityModule, GoogleCalendarModule, AiModule, NotificationModule],
  providers: [
    CallService,
    PaginationService,
    UserHierarchyService,
    CallFilterBuilder,
    CallPolicy,
    UserPolicy,
  ],
  controllers: [CallController],
})
export class CallModule {}
