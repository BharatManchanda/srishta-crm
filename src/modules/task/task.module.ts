import { forwardRef, Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { JwtModule } from '../jwt/jwt.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { TaskFilterBuilder } from './task-filter.builder';
import { TaskPolicy } from './task.policy';
import { ActivityModule } from '../activity/activity.module';
import { GoogleCalendarModule } from '../google-calendar/google-calendar.module';
import { UserModule } from '../user/user.module';
import { AiModule } from '../ai/ai.module';
import { NotificationModule } from '../notification/notification.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { ModuleFieldService } from '../module-field/module-field.service';
import { ModuleFieldFilterBuilder } from '../module-field/module-field-filter.builder';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [PrismaModule, JwtModule, ActivityModule, GoogleCalendarModule, AiModule, NotificationModule, WhatsappModule, forwardRef(() => UserModule), PaymentsModule],
  providers: [
    TaskService,
    PaginationService,
    UserHierarchyService,
    TaskFilterBuilder,
    TaskPolicy,
    ModuleFieldService,
    ModuleFieldFilterBuilder
  ],
  controllers: [TaskController],
})
export class TaskModule {}
