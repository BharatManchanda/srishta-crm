import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskFilterDto } from './dto/task-filter.dto';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { TaskFilterBuilder } from './task-filter.builder';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { TaskCreateDto } from './dto/task-create.dto';
import { TaskUpdateDto } from './dto/task-update.dto';

@Injectable()
export class TaskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly taskFilterBuilder: TaskFilterBuilder,
    private readonly userHierarchyService: UserHierarchyService,
  ) {}

  async getList(dto: TaskFilterDto, currentUserId: number) {
    const orderBy = dto.sortBy ? { [dto.sortBy]: dto.sortOrder || 'desc' } : { id: 'desc' };

    const result = await this.paginationService.paginate(this.prisma.task, {
      page: dto.page,
      perPage: dto.perPage,
      where: {
        ...this.taskFilterBuilder.build(dto),
        createdById: {
          in: await this.userHierarchyService.getFamilyUserIds(currentUserId),
        },
        id: {
          in: dto.id !== undefined && dto.id ? [dto.id] : undefined,
        },
      },
      include: {
        createdBy: true,
      },
      orderBy,
    });
    return result;
  }

  async get(id: number) {
    const task = await this.prisma.task.findFirst({
      where: {
        id,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async create(dto: TaskCreateDto, authUserId: number) {
    return await this.prisma.task.create({
      data: {
        ...dto,
        createdById: authUserId,
      },
    });
  }

  async update(dto: TaskUpdateDto, id: number) {
    const existingTask = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      throw new NotFoundException('Task not found');
    }

    return await this.prisma.task.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: number) {
    const existingTask = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      throw new NotFoundException('Task not found');
    }

    return await this.prisma.task.delete({
      where: {
        id,
      },
    });
  }
}
