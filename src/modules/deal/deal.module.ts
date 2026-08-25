import { Module } from '@nestjs/common';
import { DealController } from './deal.controller';
import { DealService } from './deal.service';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { DealFilterBuilder } from './deal-filter.builder';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { ActivityService } from '../activity/activity.service';
import { AiService } from '../ai/ai.service';
import { NotificationService } from '../notification/notification.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '../jwt/jwt.module';
import { ActivityModule } from '../activity/activity.module';
import { AiModule } from '../ai/ai.module';
import { NotificationModule } from '../notification/notification.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { ModuleFieldService } from '../module-field/module-field.service';
import { ModuleFieldFilterBuilder } from '../module-field/module-field-filter.builder';
import { ActivityFilterBuilder } from '../activity/activity-filter.builder';
import { DealPolicy } from './deal.policy';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [PrismaModule, JwtModule, ActivityModule, AiModule, NotificationModule, WhatsappModule, PaymentsModule],
  controllers: [DealController],
  providers: [
    DealService,
    DealPolicy,
    DealFilterBuilder,
    PaginationService,
    UserHierarchyService,
    ActivityService,
    AiService,
    NotificationService,
    WhatsappService,
    ModuleFieldService,
    ModuleFieldFilterBuilder,
    ActivityFilterBuilder,
  ],
})
export class DealModule {}
