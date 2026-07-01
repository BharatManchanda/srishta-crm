import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CallFilterDto } from './dto/call-filter.dto';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { CallFilterBuilder } from './call-filter.builder';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { CallCreateDto } from './dto/call-create.dto';
import { CallUpdateDto } from './dto/call-update.dto';
import { UpdateViewSettingDto } from './dto/update-view-setting.dto';

@Injectable()
export class CallService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly callFilterBuilder: CallFilterBuilder,
    private readonly userHierarchyService: UserHierarchyService,
  ) {}

  async getList(dto: CallFilterDto, currentUserId: number) {
    const orderBy = dto.sortBy ? { [dto.sortBy]: dto.sortOrder || 'desc' } : { id: 'desc' };

    const result = await this.paginationService.paginate(this.prisma.call, {
      page: dto.page,
      perPage: dto.perPage,
      where: {
        ...this.callFilterBuilder.build(dto),
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
    return await this.prisma.call.create({
      data: {
        ...dto,
        createdById: authUserId,
      },
    });
  }

  async update(dto: CallUpdateDto, id: number) {
    const existingCall = await this.prisma.call.findUnique({
      where: { id },
    });

    if (!existingCall) {
      throw new NotFoundException('Call not found');
    }

    return await this.prisma.call.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: number) {
    const existingCall = await this.prisma.call.findUnique({
      where: { id },
    });

    if (!existingCall) {
      throw new NotFoundException('Call not found');
    }

    return await this.prisma.call.delete({
      where: {
        id,
      },
    });
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
          },
        }),
      ),
    );

    return updatedColumns;
  }
}
