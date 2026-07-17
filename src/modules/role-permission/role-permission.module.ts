import { Module } from '@nestjs/common';
import { RolePermissionController } from './role-permission.controller';
import { RolePermissionService } from './role-permission.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtModule } from '../jwt/jwt.module';
import { UserHierarchyService } from '../user/user-hierarchy.service';

@Module({
  imports: [JwtModule],
  controllers: [RolePermissionController],
  providers: [RolePermissionService, PrismaService, UserHierarchyService]
})
export class RolePermissionModule {}
