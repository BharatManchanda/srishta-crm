import { Module } from '@nestjs/common';
import { ModuleService } from './module.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { UserPolicy } from '../user/user.policy';

@Module({
  imports: [PrismaModule],
  providers: [ModuleService, UserHierarchyService, UserPolicy],
  exports: [ModuleService],
})
export class ModuleModule {}
