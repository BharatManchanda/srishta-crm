import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { JwtModule } from '../jwt/jwt.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { AccountFilterBuilder } from './account-filter.builder';
import { AccountPolicy } from './account.policy';

@Module({
  imports: [PrismaModule, JwtModule],
  providers: [
    AccountService,
    PaginationService,
    UserHierarchyService,
    AccountFilterBuilder,
    AccountPolicy,
  ],
  controllers: [AccountController],
})
export class AccountModule {}
