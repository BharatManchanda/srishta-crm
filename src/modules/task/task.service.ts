import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TaskFilterDto } from './dto/task-filter.dto';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { TaskFilterBuilder } from './task-filter.builder';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { TaskCreateDto } from './dto/task-create.dto';
import { TaskUpdateDto } from './dto/task-update.dto';
import { BulkTaskCreateDto } from './dto/bulk-task-create.dto';
import { UpdateViewSettingDto } from './dto/update-view-setting.dto';

import { ActivityService } from '../activity/activity.service';
import { ActivityEntity, AiEntityType } from '@prisma/client';
import { UserPolicy } from '../user/user.policy';
import { AiService } from '../ai/ai.service';
import { taskToDocument } from 'src/common/helpers/build-document';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class TaskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly taskFilterBuilder: TaskFilterBuilder,
    private readonly userPolicy: UserPolicy,
    private readonly activityService: ActivityService,
    private readonly aiService: AiService,
    private readonly notificationService: NotificationService,
    @InjectQueue('google-calendar-sync') private readonly calendarSyncQueue: Queue,
  ) {}

  async getList(dto: TaskFilterDto, currentUserId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      select: { accessLevel: true },
    });

    const where: any = {
      ...this.taskFilterBuilder.build(dto),
      id: {
        in: dto.id !== undefined && dto.id ? [dto.id] : undefined,
      },
    };

    if (user?.accessLevel === 'STANDARD') {
      where.ownerId = currentUserId;
    } else {
      const userIds = await this.userPolicy.getAccessibleUserIds(currentUserId);
      where.OR = [
        { createdById: { in: userIds } },
        { ownerId: { in: userIds } }
      ];
    }

    const orderBy = dto.sortBy ? { [dto.sortBy]: dto.sortOrder || 'desc' } : { id: 'desc' };

    const result = await this.paginationService.paginate(this.prisma.task, {
      page: dto.page,
      perPage: dto.perPage,
      where,
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
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const [notes, attachments] = await Promise.all([
      this.prisma.note.count({ where: { entityType: 'TASK', entityId: id } }),
      this.prisma.attachment.count({ where: { entityType: 'TASK', entityId: id } }),
    ]);

    return {
      ...task,
      counts: {
        notes,
        attachments,
      },
    };
  }

  async create(dto: TaskCreateDto, authUserId: number) {
    const newTask = await this.prisma.task.create({
      data: {
        ...dto,
        createdById: authUserId,
        ownerId: dto.ownerId || authUserId,
      },
    });

    if (newTask.ownerId && newTask.ownerId !== authUserId) {
      await this.notificationService.create({
        title: 'Task Assigned',
        message: `Task "${newTask.subject}" has been assigned to you.`,
        type: 'TASK',
        module: 'TASK',
        entityId: newTask.id,
        createdBy: authUserId,
        userIds: [newTask.ownerId],
      });
    }

    // 1. Log under Task itself
    await this.activityService.create({
      entityType: ActivityEntity.TASK,
      entityId: newTask.id,
      action: 'TASK_ADDED',
      description: `Task created: "${newTask.subject}"`,
      metadata: newTask,
    }, authUserId);

    // 2. Log under parent entity if exists
    if (dto.entityType && dto.entityId) {
      await this.activityService.create({
        entityType: dto.entityType as any,
        entityId: dto.entityId,
        action: 'TASK_ADDED',
        description: `Task created: "${dto.subject}"`,
        metadata: newTask,
      }, authUserId);
    }

    await this.calendarSyncQueue.add('sync-task', { taskId: newTask.id });

    this.aiService.create({
      entityType: AiEntityType.TASK,
      entityId: newTask.id,
      title: newTask.subject,
      content: taskToDocument(newTask.description),
    }, authUserId);

    return newTask;
  }

  async update(dto: TaskUpdateDto, id: number, authUserId: number) {
    const oldTask = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!oldTask) {
      throw new NotFoundException('Task not found');
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: dto,
    });

    if (updatedTask.ownerId && oldTask && oldTask.ownerId !== updatedTask.ownerId) {
      await this.notificationService.create({
        title: 'Task Assigned',
        message: `Task "${updatedTask.subject}" has been assigned to you.`,
        type: 'TASK',
        module: 'TASK',
        entityId: updatedTask.id,
        createdBy: authUserId,
        userIds: [updatedTask.ownerId],
      });
    }

    // 1. Log under Task itself
    await this.activityService.create({
      entityType: ActivityEntity.TASK,
      entityId: updatedTask.id,
      action: 'TASK_EDIT',
      description: `Task "${updatedTask.subject}" updated.`,
      metadata: {
        before: oldTask,
        after: updatedTask,
      },
    }, authUserId);

    // 2. Log under parent entity if exists
    if (oldTask.entityType && oldTask.entityId) {
      await this.activityService.create(
        {
          entityType: oldTask.entityType as any,
          entityId: oldTask.entityId,
          action: 'TASK_EDIT',
          description: `Task updated: "${updatedTask.subject}" (Status: ${updatedTask.status})`,
          metadata: {
            before: oldTask,
            after: updatedTask,
          },
        },
        authUserId,
      );
    }

    await this.calendarSyncQueue.add('sync-task', { taskId: updatedTask.id });

    await this.aiService.update({
      entityType: AiEntityType.TASK,
      entityId: updatedTask.id,
      title: updatedTask.subject,
      content: taskToDocument(updatedTask),
    });

    return updatedTask;
  }

  async delete(id: number, authUserId: number) {
    const existingTask = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      throw new NotFoundException('Task not found');
    }

    const syncRecords = await this.prisma.calendarSyncRecord.findMany({
      where: {
        entityType: 'TASK',
        entityId: id,
      },
    });

    for (const record of syncRecords) {
      if (record.googleEventId) {
        await this.calendarSyncQueue.add('delete-calendar-event', {
          userId: record.userId,
          googleEventId: record.googleEventId,
        });
      }
    }

    await this.prisma.calendarSyncRecord.deleteMany({
      where: {
        entityType: 'TASK',
        entityId: id,
      },
    });

    const deletedTask = await this.prisma.task.delete({
      where: {
        id,
      },
    });

    // 1. Log under Task itself
    await this.activityService.create({
      entityType: ActivityEntity.TASK,
      entityId: deletedTask.id,
      action: 'TASK_DELETED',
      description: `Task deleted: "${deletedTask.subject}"`,
      metadata: deletedTask,
    }, authUserId);

    // 2. Log under parent entity if exists
    if (existingTask.entityType && existingTask.entityId) {
      await this.activityService.create({
        entityType: existingTask.entityType as any,
        entityId: existingTask.entityId,
        action: 'TASK_DELETED',
        description: `Task deleted: "${deletedTask.subject}"`,
        metadata: deletedTask,
      }, authUserId);
    }

    return deletedTask;
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
            { field: 'entityType', label: 'Related To Type', visible: true, order: 6 },
            { field: 'entityId', label: 'Related To ID', visible: true, order: 7 },
            { field: 'description', label: 'Description', visible: false, order: 8 },
            { field: 'createdById', label: 'Created By ID', visible: false, order: 9 },
            { field: 'createdAt', label: 'Created At', visible: false, order: 10 },
            { field: 'updatedAt', label: 'Updated At', visible: false, order: 11 },
            { field: 'action', label: 'Action', visible: true, order: 12 },
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
            ...(column.order !== undefined ? { order: column.order } : {}),
          },
        }),
      ),
    );

    return updatedColumns;
  }

  async bulkCreate(dto: BulkTaskCreateDto, authUserId: number) {
    const tasks: any[] = [];
    const { entityIds, ...taskData } = dto;
    for (const entityId of entityIds) {
      const task = await this.create({
        ...taskData,
        entityId,
      } as any, authUserId);
      tasks.push(task);
    }
    return tasks;
  }

  async bulkDelete(ids: number[], authUserId: number) {
    const deletedTasks: any[] = [];
    for (const id of ids) {
      const deleted = await this.delete(id, authUserId);
      deletedTasks.push(deleted);
    }
    return deletedTasks;
  }

  async bulkUpdate(ids: number[], data: any, authUserId: number) {
    const whitelistedKeys = [
      'priority',
      'status',
      'description',
    ];

    const cleanData = {};
    for (const key of Object.keys(data)) {
      if (whitelistedKeys.includes(key)) {
        cleanData[key] = data[key];
      }
    }

    const updatedTasks: any[] = [];
    for (const id of ids) {
      const updated = await this.update(cleanData as any, id, authUserId);
      updatedTasks.push(updated);
    }
    return updatedTasks;
  }
}

