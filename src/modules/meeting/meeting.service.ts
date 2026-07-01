import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MeetingFilterDto } from './dto/meeting-filter.dto';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { MeetingFilterBuilder } from './meeting-filter.builder';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { MeetingCreateDto } from './dto/meeting-create.dto';
import { MeetingUpdateDto } from './dto/meeting-update.dto';
import { UpdateViewSettingDto } from './dto/update-view-setting.dto';

@Injectable()
export class MeetingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly meetingFilterBuilder: MeetingFilterBuilder,
    private readonly userHierarchyService: UserHierarchyService,
  ) {}

  async getList(dto: MeetingFilterDto, currentUserId: number) {
    const orderBy = dto.sortBy ? { [dto.sortBy]: dto.sortOrder || 'desc' } : { id: 'desc' };

    const result = await this.paginationService.paginate(this.prisma.meeting, {
      page: dto.page,
      perPage: dto.perPage,
      where: {
        ...this.meetingFilterBuilder.build(dto),
        createdById: {
          in: await this.userHierarchyService.getFamilyUserIds(currentUserId),
        },
        id: {
          in: dto.id !== undefined && dto.id ? [dto.id] : undefined,
        },
      },
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

    return await this.prisma.meeting.create({
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
  }

  async update(dto: MeetingUpdateDto, id: number) {
    const { participants, ...meetingData } = dto;

    const existingMeeting = await this.prisma.meeting.findUnique({
      where: { id },
    });

    if (!existingMeeting) {
      throw new NotFoundException('Meeting not found');
    }

    return await this.prisma.$transaction(async (tx) => {
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
  }

  async delete(id: number) {
    const existingMeeting = await this.prisma.meeting.findUnique({
      where: { id },
    });

    if (!existingMeeting) {
      throw new NotFoundException('Meeting not found');
    }

    // MeetingParticipant will be auto-deleted because of onDelete: Cascade in Prisma schema
    return await this.prisma.meeting.delete({
      where: {
        id,
      },
    });
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
          },
        }),
      ),
    );

    return updatedColumns;
  }
}
