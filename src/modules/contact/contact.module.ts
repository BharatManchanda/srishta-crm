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

@Module({
  imports: [PrismaModule, JwtModule, ActivityModule],
  providers: [
    ContactService,
    PaginationService,
    UserHierarchyService,
    ContactFilterBuilder,
    ContactPolicy,
  ],
  controllers: [ContactController],
  exports: [ContactService],
})
export class ContactModule {}
