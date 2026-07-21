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

@Module({
  imports: [PrismaModule, JwtModule, ActivityModule, AiModule],
  providers: [
    AccountService,
    PaginationService,
    UserHierarchyService,
    AccountFilterBuilder,
    AccountPolicy,
  ],
  controllers: [AccountController],
  exports: [AccountService],
})
export class AccountModule {}
