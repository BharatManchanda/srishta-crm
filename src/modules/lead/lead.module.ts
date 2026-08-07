import { Module } from '@nestjs/common';
import { LeadController } from './lead.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { LeadFilterBuilder } from './lead-filter.builder';
import { JwtModule } from '../jwt/jwt.module';
import { LeadPolicy } from './lead.policy';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { LeadService } from './lead.service';
import { ActivityModule } from '../activity/activity.module';
import { AiModule } from '../ai/ai.module';
import { NotificationModule } from '../notification/notification.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { ModuleFieldService } from '../module-field/module-field.service';
import { ModuleFieldFilterBuilder } from '../module-field/module-field-filter.builder';

@Module({
  imports: [PrismaModule, JwtModule, ActivityModule, AiModule, NotificationModule, WhatsappModule],
  controllers: [LeadController],
  providers: [
    LeadService,
    PaginationService,
    LeadFilterBuilder,
    LeadPolicy,
    UserHierarchyService,
    ModuleFieldService,
    ModuleFieldFilterBuilder
  ],
  exports: [LeadService],
})
export class LeadModule {}
