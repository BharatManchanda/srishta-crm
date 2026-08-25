import { forwardRef, Module } from '@nestjs/common';
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
import { UserModule } from '../user/user.module';
import { AiModule } from '../ai/ai.module';
import { EmailModule } from '../email/email.module';
import { NotificationModule } from '../notification/notification.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { ModuleFieldService } from '../module-field/module-field.service';
import { ModuleFieldFilterBuilder } from '../module-field/module-field-filter.builder';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [PrismaModule, JwtModule, ActivityModule, GoogleCalendarModule, AiModule, EmailModule, NotificationModule, WhatsappModule, forwardRef(() => UserModule), PaymentsModule],
  providers: [
    MeetingService,
    PaginationService,
    UserHierarchyService,
    MeetingFilterBuilder,
    MeetingPolicy,
    ModuleFieldService,
    ModuleFieldFilterBuilder,
  ],
  controllers: [MeetingController],
})
export class MeetingModule {}
