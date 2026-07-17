import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { JwtModule } from '../jwt/jwt.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { TaskFilterBuilder } from './task-filter.builder';
import { TaskPolicy } from './task.policy';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [PrismaModule, JwtModule, ActivityModule],
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
