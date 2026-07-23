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

@Module({
  imports: [PrismaModule, JwtModule, ActivityModule, AiModule, NotificationModule],
  controllers: [LeadController],
  providers: [
    LeadService,
    PaginationService,
    LeadFilterBuilder,
    LeadPolicy,
    UserHierarchyService,
  ],
  exports: [LeadService],
})
export class LeadModule {}
