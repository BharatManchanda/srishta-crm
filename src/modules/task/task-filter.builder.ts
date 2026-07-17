import { Injectable } from '@nestjs/common';
import { PrismaFilter } from 'src/common/filters/prisma-filter.helper';
import { TaskFilterDto } from './dto/task-filter.dto';

@Injectable()
export class TaskFilterBuilder {
  build(dto: TaskFilterDto) {
    return {
      id: PrismaFilter.equals(dto.id),
      entityType: PrismaFilter.equals(dto.entityType),
      entityId: PrismaFilter.equals(dto.entityId),
      subject: PrismaFilter.contains(dto.subject),
      priority: dto.priority,
      status: dto.status,
      description: PrismaFilter.contains(dto.description),
      dueDate: PrismaFilter.dateRange(dto.dueDateFrom, dto.dueDateTo),
      createdAt: PrismaFilter.dateRange(dto.createdFrom, dto.createdTo),
      updatedAt: PrismaFilter.dateRange(dto.updatedFrom, dto.updatedTo),
    };
  }
}
