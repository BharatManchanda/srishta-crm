import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { JwtModule } from '../jwt/jwt.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { TaskFilterBuilder } from './task-filter.builder';
import { TaskPolicy } from './task.policy';

@Module({
  imports: [PrismaModule, JwtModule],
  providers: [
    TaskService,
    PaginationService,
    UserHierarchyService,
    TaskFilterBuilder,
    TaskPolicy,
  ],
  controllers: [TaskController],
})
export class TaskModule {}
