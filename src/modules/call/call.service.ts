import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CallFilterDto } from './dto/call-filter.dto';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { CallFilterBuilder } from './call-filter.builder';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { CallCreateDto } from './dto/call-create.dto';
import { CallUpdateDto } from './dto/call-update.dto';
import { UpdateViewSettingDto } from './dto/update-view-setting.dto';
import { ActivityService } from '../activity/activity.service';
import { ActivityEntity } from '@prisma/client';

@Injectable()
export class CallService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly callFilterBuilder: CallFilterBuilder,
    private readonly userHierarchyService: UserHierarchyService,
    private readonly activityService: ActivityService,
    @InjectQueue('google-calendar-sync') private readonly calendarSyncQueue: Queue,
  ) {}

  async getList(dto: CallFilterDto, currentUserId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      select: { accessLevel: true },
    });

    const where: any = {
      ...this.callFilterBuilder.build(dto),
      id: {
        in: dto.id !== undefined && dto.id ? [dto.id] : undefined,
      },
    };

    if (user?.accessLevel === 'STANDARD') {
      where.ownerId = currentUserId;
    } else {
      const userIds = await this.userHierarchyService.getFamilyUserIds(currentUserId);
      where.OR = [
        { createdById: { in: userIds } },
        { ownerId: { in: userIds } }
      ];
    }

    const orderBy = dto.sortBy ? { [dto.sortBy]: dto.sortOrder || 'desc' } : { id: 'desc' };

    const result = await this.paginationService.paginate(this.prisma.call, {
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
    const call = await this.prisma.call.findFirst({
      where: {
        id,
      },
      include: {
        createdBy: true,
      },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    return call;
  }

  async create(dto: CallCreateDto, authUserId: number) {
    const newCall = await this.prisma.call.create({
      data: {
        ...dto,
        createdById: authUserId,
        ownerId: dto.ownerId || authUserId,
      },
    });

    // 1. Log under Call itself
    await this.activityService.create({
      entityType: ActivityEntity.CALL,
      entityId: newCall.id,
      action: 'CALL_ADDED',
      description: `Call logged: "${newCall.subject}"`,
      metadata: newCall,
    }, authUserId);

    // 2. Log under parent entity if exists
    if (dto.entityType && dto.entityId) {
      await this.activityService.create({
        entityType: dto.entityType as any,
        entityId: dto.entityId,
        action: 'CALL_ADDED',
        description: `Call logged: "${dto.subject}" (Purpose: ${dto.purpose || 'None'})`,
        metadata: newCall,
      }, authUserId);
    }

    await this.calendarSyncQueue.add('sync-call', { callId: newCall.id });

    return newCall;
  }

  async update(dto: CallUpdateDto, id: number, authUserId: number) {
    const oldCall = await this.prisma.call.findUnique({
      where: { id },
    });

    if (!oldCall) {
      throw new NotFoundException('Call not found');
    }

    const updatedCall = await this.prisma.call.update({
      where: { id },
      data: dto,
    });

    // 1. Log under Call itself
    await this.activityService.create({
      entityType: ActivityEntity.CALL,
      entityId: updatedCall.id,
      action: 'CALL_EDIT',
      description: `Call "${updatedCall.subject}" updated.`,
      metadata: {
        before: oldCall,
        after: updatedCall,
      },
    }, authUserId);

    // 2. Log under parent entity if exists
    if (oldCall.entityType && oldCall.entityId) {
      await this.activityService.create(
        {
          entityType: oldCall.entityType as any,
          entityId: oldCall.entityId,
          action: 'CALL_EDIT',
          description: `Call updated: "${updatedCall.subject}" (Status: ${updatedCall.status})`,
          metadata: {
            before: oldCall,
            after: updatedCall,
          },
        },
        authUserId,
      );
    }

    await this.calendarSyncQueue.add('sync-call', { callId: updatedCall.id });

    return updatedCall;
  }

  async delete(id: number, authUserId: number) {
    const existingCall = await this.prisma.call.findUnique({
      where: { id },
    });

    if (!existingCall) {
      throw new NotFoundException('Call not found');
    }

    if (existingCall.googleEventId) {
      await this.calendarSyncQueue.add('delete-calendar-event', {
        userId: authUserId,
        googleEventId: existingCall.googleEventId,
      });
    }

    const deletedCall = await this.prisma.call.delete({
      where: {
        id,
      },
    });

    // 1. Log under Call itself
    await this.activityService.create({
      entityType: ActivityEntity.CALL,
      entityId: deletedCall.id,
      action: 'CALL_DELETED',
      description: `Call deleted: "${deletedCall.subject}"`,
      metadata: deletedCall,
    }, authUserId);

    // 2. Log under parent entity if exists
    if (existingCall.entityType && existingCall.entityId) {
      await this.activityService.create({
        entityType: existingCall.entityType as any,
        entityId: existingCall.entityId,
        action: 'CALL_DELETED',
        description: `Call deleted: "${deletedCall.subject}"`,
        metadata: deletedCall,
      }, authUserId);
    }

    return deletedCall;
  }

  async createDefaultCallView(userId: number) {
    const callModule = await this.prisma.module.findUnique({
      where: {
        path: '/calls',
      },
    });
    if (!callModule) return;
    await this.prisma.userTableView.create({
      data: {
        userId: userId,
        moduleId: callModule.id,
        name: 'Default',
        isDefault: true,
        columns: {
          create: [
            { field: 'id', label: 'ID', visible: true, order: 1 },
            { field: 'subject', label: 'Subject', visible: true, order: 2 },
            { field: 'purpose', label: 'Purpose', visible: true, order: 3 },
            { field: 'status', label: 'Status', visible: true, order: 4 },
            { field: 'callStartTime', label: 'Start Time', visible: true, order: 5 },
            { field: 'callDuration', label: 'Duration (sec)', visible: true, order: 6 },
            { field: 'result', label: 'Result', visible: true, order: 7 },
            { field: 'entityType', label: 'Related To Type', visible: true, order: 8 },
            { field: 'entityId', label: 'Related To ID', visible: true, order: 9 },
            { field: 'agenda', label: 'Agenda', visible: false, order: 10 },
            { field: 'description', label: 'Description', visible: false, order: 11 },
            { field: 'createdById', label: 'Created By ID', visible: false, order: 12 },
            { field: 'createdAt', label: 'Created At', visible: false, order: 13 },
            { field: 'updatedAt', label: 'Updated At', visible: false, order: 14 },
            { field: 'action', label: 'Action', visible: true, order: 15 },
          ],
        },
      },
    });
  }

  async viewSetting(authUserId: number) {
    const callModule = await this.prisma.module.findFirst({
      where: {
        path: '/calls',
      },
    });
    if (!callModule) return;
    const viewSetting = await this.prisma.userTableView.findFirst({
      where: {
        userId: authUserId,
        isDefault: true,
        moduleId: callModule.id,
      },
      include: {
        columns: true,
      },
    });

    if (!viewSetting) {
      await this.createDefaultCallView(authUserId);
      return this.prisma.userTableView.findFirst({
        where: {
          userId: authUserId,
          isDefault: true,
          moduleId: callModule.id,
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

  async bulkDelete(ids: number[], authUserId: number) {
    const deletedCalls: any[] = [];
    for (const id of ids) {
      const deleted = await this.delete(id, authUserId);
      deletedCalls.push(deleted);
    }
    return deletedCalls;
  }

  async bulkUpdate(ids: number[], data: any, authUserId: number) {
    const whitelistedKeys = [
      'purpose',
      'result',
      'status',
      'description',
      'callDuration',
      'agenda',
    ];

    const cleanData = {};
    for (const key of Object.keys(data)) {
      if (whitelistedKeys.includes(key)) {
        cleanData[key] = data[key];
      }
    }

    const updatedCalls: any[] = [];
    for (const id of ids) {
      const updated = await this.update(cleanData as any, id, authUserId);
      updatedCalls.push(updated);
    }
    return updatedCalls;
  }
}
