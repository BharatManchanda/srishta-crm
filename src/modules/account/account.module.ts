import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { JwtModule } from '../jwt/jwt.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { AccountFilterBuilder } from './account-filter.builder';
import { AccountPolicy } from './account.policy';
import { ActivityModule } from '../activity/activity.module';
import { AiModule } from '../ai/ai.module';
import { NotificationModule } from '../notification/notification.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { ModuleFieldService } from '../module-field/module-field.service';
import { ModuleFieldFilterBuilder } from '../module-field/module-field-filter.builder';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [PrismaModule, JwtModule, ActivityModule, AiModule, NotificationModule, WhatsappModule, PaymentsModule],
  providers: [
    AccountService,
    PaginationService,
    UserHierarchyService,
    AccountFilterBuilder,
    AccountPolicy,
    ModuleFieldService,
    ModuleFieldFilterBuilder
  ],
  controllers: [AccountController],
  exports: [AccountService],
})
export class AccountModule {}
