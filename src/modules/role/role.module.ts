import { Module } from '@nestjs/common';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '../jwt/jwt.module';
import { UserHierarchyService } from '../user/user-hierarchy.service';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [RoleController],
  providers: [RoleService, UserHierarchyService]
})
export class RoleModule {}
