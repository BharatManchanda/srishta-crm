import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MeetingFilterDto } from './dto/meeting-filter.dto';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { MeetingFilterBuilder } from './meeting-filter.builder';
import { MeetingCreateDto } from './dto/meeting-create.dto';
import { MeetingUpdateDto } from './dto/meeting-update.dto';
import { UpdateViewSettingDto } from './dto/update-view-setting.dto';
import { ActivityEntity, AiEntityType } from '@prisma/client';
import { ActivityService } from '../activity/activity.service';
import { UserPolicy } from '../user/user.policy';
import { AiService } from '../ai/ai.service';
import { meetingToDocument } from 'src/common/helpers/build-document';

@Injectable()
export class MeetingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly meetingFilterBuilder: MeetingFilterBuilder,
    private readonly activityService: ActivityService,
    private readonly userPolicy: UserPolicy,
    private readonly aiService: AiService,
    @InjectQueue('google-calendar-sync') private readonly calendarSyncQueue: Queue,
  ) {}

  async getList(dto: MeetingFilterDto, currentUserId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      select: { accessLevel: true },
    });

    const where: any = {
      ...this.meetingFilterBuilder.build(dto),
      id: {
        in: dto.id !== undefined && dto.id ? [dto.id] : undefined,
      },
    };

    if (user?.accessLevel === 'STANDARD') {
      where.participants = {
        some: {
          participantType: 'USER',
          participantId: currentUserId,
        },
      };
    } else {
      where.createdById = {
        in: await this.userPolicy.getAccessibleUserIds(currentUserId),
      };
    }

    const orderBy = dto.sortBy ? { [dto.sortBy]: dto.sortOrder || 'desc' } : { id: 'desc' };

    const result = await this.paginationService.paginate(this.prisma.meeting, {
      page: dto.page,
      perPage: dto.perPage,
      where,
      include: {
        createdBy: true,
        participants: true,
      },
      orderBy,
    });
    return result;
  }

  async get(id: number) {
    const meeting = await this.prisma.meeting.findFirst({
      where: {
        id,
      },
      include: {
        createdBy: true,
        participants: true,
      },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    return meeting;
  }

  async create(dto: MeetingCreateDto, authUserId: number) {
    const { participants, ...meetingData } = dto;

    const meeting = await this.prisma.meeting.create({
      data: {
        ...meetingData,
        createdById: authUserId,
        participants: participants && participants.length > 0 ? {
          create: participants,
        } : undefined,
      },
      include: {
        participants: true,
      },
    });

    // 1. Log under Meeting itself
    await this.activityService.create({
      entityType: ActivityEntity.MEETING,
      entityId: meeting.id,
      action: 'MEETINGS_ADDED',
      description: `Meeting "${meeting.title}" scheduled.`,
      metadata: {
        title: meeting.title,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
      },
    }, authUserId);

    // 2. Log under parent entity if exists
    if (meeting.entityType && meeting.entityId) {
      await this.activityService.create({
        entityType: meeting.entityType as any,
        entityId: meeting.entityId,
        action: 'MEETINGS_ADDED',
        description: `Meeting scheduled: "${meeting.title}"`,
        metadata: {
          title: meeting.title,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
        },
      }, authUserId);
    }

    await this.calendarSyncQueue.add('sync-meeting', { meetingId: meeting.id });

    await this.aiService.create({
      entityType: AiEntityType.MEETING,
      entityId: meeting.id,
      title: meeting.title ?? "",
      content: meetingToDocument(meeting),
    }, authUserId);

    return meeting;
  }

  async update(dto: MeetingUpdateDto, id: number, authUserId: number) {
    const { participants, ...meetingData } = dto;

    const existingMeeting = await this.prisma.meeting.findUnique({
      where: { id },
    });

    if (!existingMeeting) {
      throw new NotFoundException('Meeting not found');
    }

    const updatedMeeting = await this.prisma.$transaction(async (tx) => {
      if (participants !== undefined) {
        // Delete existing participants
        await tx.meetingParticipant.deleteMany({
          where: { meetingId: id },
        });

        // Re-create participants if any are provided
        if (participants.length > 0) {
          await tx.meetingParticipant.createMany({
            data: participants.map((p) => ({
              ...p,
              meetingId: id,
            })),
          });
        }
      }

      return await tx.meeting.update({
        where: { id },
        data: meetingData,
        include: {
          participants: true,
        },
      });
    });

    // 1. Log under Meeting itself
    await this.activityService.create({
      entityType: ActivityEntity.MEETING,
      entityId: updatedMeeting.id,
      action: 'MEETINGS_EDIT',
      description: `Meeting "${updatedMeeting.title}" updated.`,
      metadata: {
        before: existingMeeting,
        after: updatedMeeting,
      },
    }, authUserId);

    // 2. Log under parent entity if exists
    if (updatedMeeting.entityType && updatedMeeting.entityId) {
      await this.activityService.create({
        entityType: updatedMeeting.entityType as any,
        entityId: updatedMeeting.entityId,
        action: 'MEETINGS_EDIT',
        description: `Meeting updated: "${updatedMeeting.title}" (Status: ${updatedMeeting.status})`,
        metadata: {
          before: existingMeeting,
          after: updatedMeeting,
        },
      }, authUserId);
    }

    await this.calendarSyncQueue.add('sync-meeting', { meetingId: updatedMeeting.id });

    await this.aiService.update({
      entityType: AiEntityType.MEETING,
      entityId: updatedMeeting.id,
      title: updatedMeeting.title ?? "",
      content: meetingToDocument(updatedMeeting),
    });

    return updatedMeeting;
  }

  async delete(id: number, authUserId: number) {
    const existingMeeting = await this.prisma.meeting.findUnique({
      where: { id },
    });

    if (!existingMeeting) {
      throw new NotFoundException('Meeting not found');
    }

    const syncRecords = await this.prisma.calendarSyncRecord.findMany({
      where: {
        entityType: 'MEETING',
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
        entityType: 'MEETING',
        entityId: id,
      },
    });

    // MeetingParticipant will be auto-deleted because of onDelete: Cascade in Prisma schema
    const meeting = await this.prisma.meeting.delete({
      where: {
        id,
      },
    });

    // 1. Log under Meeting itself
    await this.activityService.create({
      entityType: ActivityEntity.MEETING,
      entityId: meeting.id,
      action: 'MEETINGS_DELETED',
      description: `Meeting "${meeting.title}" deleted.`,
      metadata: {
        title: meeting.title,
      },
    }, authUserId);

    // 2. Log under parent entity if exists
    if (existingMeeting.entityType && existingMeeting.entityId) {
      await this.activityService.create({
        entityType: existingMeeting.entityType as any,
        entityId: existingMeeting.entityId,
        action: 'MEETINGS_DELETED',
        description: `Meeting deleted: "${meeting.title}"`,
        metadata: {
          title: meeting.title,
        },
      }, authUserId);
    }

    return meeting;
  }

  async createDefaultMeetingView(userId: number) {
    const meetingModule = await this.prisma.module.findUnique({
      where: {
        path: '/meetings',
      },
    });
    if (!meetingModule) return;
    await this.prisma.userTableView.create({
      data: {
        userId: userId,
        moduleId: meetingModule.id,
        name: 'Default',
        isDefault: true,
        columns: {
          create: [
            { field: 'id', label: 'ID', visible: true, order: 1 },
            { field: 'title', label: 'Title', visible: true, order: 2 },
            { field: 'startTime', label: 'Start Time', visible: true, order: 3 },
            { field: 'endTime', label: 'End Time', visible: true, order: 4 },
            { field: 'location', label: 'Location', visible: true, order: 5 },
            { field: 'url', label: 'Meeting URL', visible: true, order: 6 },
            { field: 'status', label: 'Status', visible: true, order: 7 },
            { field: 'entityType', label: 'Related To Type', visible: true, order: 8 },
            { field: 'entityId', label: 'Related To ID', visible: true, order: 9 },
            { field: 'description', label: 'Description', visible: false, order: 10 },
            { field: 'createdById', label: 'Created By ID', visible: false, order: 11 },
            { field: 'createdAt', label: 'Created At', visible: false, order: 12 },
            { field: 'updatedAt', label: 'Updated At', visible: false, order: 13 },
            { field: 'action', label: 'Action', visible: true, order: 14 },
          ],
        },
      },
    });
  }

  async viewSetting(authUserId: number) {
    const meetingModule = await this.prisma.module.findFirst({
      where: {
        path: '/meetings',
      },
    });
    if (!meetingModule) return;
    const viewSetting = await this.prisma.userTableView.findFirst({
      where: {
        userId: authUserId,
        isDefault: true,
        moduleId: meetingModule.id,
      },
      include: {
        columns: true,
      },
    });

    if (!viewSetting) {
      await this.createDefaultMeetingView(authUserId);
      return this.prisma.userTableView.findFirst({
        where: {
          userId: authUserId,
          isDefault: true,
          moduleId: meetingModule.id,
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
    const deletedMeetings: any[] = [];
    for (const id of ids) {
      const deleted = await this.delete(id, authUserId);
      deletedMeetings.push(deleted);
    }
    return deletedMeetings;
  }

  async bulkUpdate(ids: number[], data: any, authUserId: number) {
    const whitelistedKeys = [
      'status',
      'description',
      'location',
      'url',
    ];

    const cleanData = {};
    for (const key of Object.keys(data)) {
      if (whitelistedKeys.includes(key)) {
        cleanData[key] = data[key];
      }
    }

    const updatedMeetings: any[] = [];
    for (const id of ids) {
      const updated = await this.update(cleanData as any, id, authUserId);
      updatedMeetings.push(updated);
    }
    return updatedMeetings;
  }
}
