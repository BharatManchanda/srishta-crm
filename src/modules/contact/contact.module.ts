import { Module } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';
import { JwtModule } from '../jwt/jwt.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { ContactFilterBuilder } from './contact-filter.builder';
import { ContactPolicy } from './contact.policy';
import { ActivityModule } from '../activity/activity.module';
import { AiModule } from '../ai/ai.module';
import { NotificationModule } from '../notification/notification.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { ModuleFieldService } from '../module-field/module-field.service';
import { ModuleFieldFilterBuilder } from '../module-field/module-field-filter.builder';

@Module({
  imports: [PrismaModule, JwtModule, ActivityModule, AiModule, NotificationModule, WhatsappModule],
  providers: [
    ContactService,
    PaginationService,
    UserHierarchyService,
    ContactFilterBuilder,
    ContactPolicy,
    ModuleFieldService,
    ModuleFieldFilterBuilder
    
  ],
  controllers: [ContactController],
  exports: [ContactService],
})
export class ContactModule {}
