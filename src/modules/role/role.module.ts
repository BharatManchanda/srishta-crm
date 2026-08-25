import { Module } from '@nestjs/common';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '../jwt/jwt.module';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { RolePolicy } from './role.policy';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [PrismaModule, JwtModule, PaymentsModule],
  controllers: [RoleController],
  providers: [RoleService, UserHierarchyService, RolePolicy],
  exports: [RolePolicy],
})
export class RoleModule {}
