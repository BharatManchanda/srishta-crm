import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskFilterDto } from './dto/task-filter.dto';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { TaskFilterBuilder } from './task-filter.builder';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { TaskCreateDto } from './dto/task-create.dto';
import { TaskUpdateDto } from './dto/task-update.dto';
import { UpdateViewSettingDto } from './dto/update-view-setting.dto';

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

  async createDefaultTaskView(userId: number) {
    const taskModule = await this.prisma.module.findUnique({
      where: {
        path: '/tasks',
      },
    });
    if (!taskModule) return;
    await this.prisma.userTableView.create({
      data: {
        userId: userId,
        moduleId: taskModule.id,
        name: 'Default',
        isDefault: true,
        columns: {
          create: [
            { field: 'id', label: 'ID', visible: true, order: 1 },
            { field: 'subject', label: 'Subject', visible: true, order: 2 },
            { field: 'dueDate', label: 'Due Date', visible: true, order: 3 },
            { field: 'priority', label: 'Priority', visible: true, order: 4 },
            { field: 'status', label: 'Status', visible: true, order: 5 },
            { field: 'markAsComplete', label: 'Completed', visible: true, order: 6 },
            { field: 'entityType', label: 'Related To Type', visible: true, order: 7 },
            { field: 'entityId', label: 'Related To ID', visible: true, order: 8 },
            { field: 'description', label: 'Description', visible: false, order: 9 },
            { field: 'createdById', label: 'Created By ID', visible: false, order: 10 },
            { field: 'createdAt', label: 'Created At', visible: false, order: 11 },
            { field: 'updatedAt', label: 'Updated At', visible: false, order: 12 },
            { field: 'action', label: 'Action', visible: true, order: 13 },
          ],
        },
      },
    });
  }

  async viewSetting(authUserId: number) {
    const taskModule = await this.prisma.module.findFirst({
      where: {
        path: '/tasks',
      },
    });
    if (!taskModule) return;
    const viewSetting = await this.prisma.userTableView.findFirst({
      where: {
        userId: authUserId,
        isDefault: true,
        moduleId: taskModule.id,
      },
      include: {
        columns: true,
      },
    });

    if (!viewSetting) {
      await this.createDefaultTaskView(authUserId);
      return this.prisma.userTableView.findFirst({
        where: {
          userId: authUserId,
          isDefault: true,
          moduleId: taskModule.id,
        },
        include: {
          columns: true,
        },
      });
    }
    return viewSetting;
  }

  async updateSetting(dto: UpdateViewSettingDto, authUserId: number) {
    const updatedColumns = await this.prisma.$transaction(
      dto.columns.map((column) =>
        this.prisma.tableColumn.update({
          where: {
            id: column.id,
          },
          data: {
            visible: column.visible,
          },
        }),
      ),
    );

    return updatedColumns;
  }
}
