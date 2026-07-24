import { Injectable } from '@nestjs/common';
import { LeadFilterDto } from './dto/lead-filter.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { LeadFilterBuilder } from './lead-filter.builder';
import { LeadCreateDto } from './dto/lead-create.dto';
import { ActivityEntity, AiEntityType, Prisma } from '@prisma/client';
import { LeadUpdateDto } from './dto/lead-update.dto';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { UpdateViewSettingDto } from './dto/update-view-setting.dto';
import { ActivityService } from '../activity/activity.service';
import { AiService } from '../ai/ai.service';
import { leadToDocument } from 'src/common/helpers/build-document';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class LeadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly leadFilterBuilder: LeadFilterBuilder,
    private readonly userHierarchyService: UserHierarchyService,
    private readonly activityService: ActivityService,
    private readonly aiService: AiService,
    private readonly notificationService: NotificationService,
  ) { }
  async getList(dto: LeadFilterDto, currentUserId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      select: { accessLevel: true },
    });

    const where: any = {
      ...this.leadFilterBuilder.build(dto),
      id: {
        in: dto.id !== undefined && dto.id ? [dto?.id] : undefined,
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
    const result = await this.paginationService.paginate(this.prisma.lead, {
      page: dto.page,
      perPage: dto.perPage,
      paginate: dto?.paginate,
      where,
      include: {
        createdBy: true,
      },
      orderBy,
    });

    const leadIds = result.data.map((lead: any) => lead.id);
    if (leadIds.length > 0) {
      const [tasks, calls, meetings] = await Promise.all([
        this.prisma.task.findMany({
          where: {
            entityType: 'LEAD',
            entityId: { in: leadIds },
            status: { not: 'COMPLETED' },
          },
        }),
        this.prisma.call.findMany({
          where: {
            entityType: 'LEAD',
            entityId: { in: leadIds },
            status: { not: 'COMPLETED' },
          },
        }),
        this.prisma.meeting.findMany({
          where: {
            entityType: 'LEAD',
            entityId: { in: leadIds },
            endTime: { gte: new Date() },
          },
        }),
      ]);

      result.data = result.data.map((lead: any) => {
        const leadTasks = tasks.filter((t) => t.entityId === lead.id);
        const leadCalls = calls.filter((c) => c.entityId === lead.id);
        const leadMeetings = meetings.filter((m) => m.entityId === lead.id);

        return {
          ...lead,
          openActivities: {
            tasks: leadTasks,
            calls: leadCalls,
            meetings: leadMeetings,
          },
        };
      });
    }

    return result;
  }

  async create(dto: LeadCreateDto, authUserId: number) {
    const lead = await this.prisma.lead.create({
      data: {
        ...dto,
        budget: dto.budget ? new Prisma.Decimal(dto.budget) : null,
        createdById: authUserId,
        ownerId: dto.ownerId || authUserId,
      },
    });

    await this.activityService.create({
      entityType: ActivityEntity.LEAD,
      entityId: lead.id,
      action: 'LEAD_CREATED',
      description: `Lead "${lead.name}" created.`,
      metadata: {
        name: lead.name,
        email: lead.email,
        status: lead.status,
      },
    }, authUserId);

    await this.aiService.create({
      entityType: AiEntityType.LEAD,
      entityId: lead.id,
      title: lead.title ?? "",
      content: leadToDocument(lead),
    }, authUserId);

    if (lead.ownerId && lead.ownerId !== authUserId) {
      await this.notificationService.create({
        title: 'Lead Assigned',
        message: `Lead "${lead.name}" has been assigned to you.`,
        type: 'LEAD',
        module: 'LEAD',
        entityId: lead.id,
        createdBy: authUserId,
        userIds: [lead.ownerId],
      });
    }

    return lead;
  }

  async get(id: number) {
    const [
      lead,
      notes,
      attachments,
      tasks,
      calls,
      meetings,
      emails,
    ] = await this.prisma.$transaction([
      this.prisma.lead.findUnique({
        where: { id },
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
      }),

      this.prisma.note.count({
        where: {
          entityType: "LEAD",
          entityId: id,
        },
      }),

      this.prisma.attachment.count({
        where: {
          entityType: "LEAD",
          entityId: id,
        },
      }),

      this.prisma.task.count({
        where: {
          entityType: "LEAD",
          entityId: id,
        },
      }),

      this.prisma.call.count({
        where: {
          entityType: "LEAD",
          entityId: id,
        },
      }),

      this.prisma.meeting.count({
        where: {
          entityType: "LEAD",
          entityId: id,
        },
      }),

      this.prisma.email.count({
        where: {
          entityType: "LEAD",
          entityId: id,
        },
      }),
    ]);

    return {
      ...lead,
      counts: {
        notes,
        attachments,
        tasks,
        calls,
        meetings,
        emails,
      },
    };
  }

  async update(dto: LeadUpdateDto, id: number, authUserId: number) {
    const oldLead = await this.prisma.lead.findUnique({ where: { id } });

    const lead = await this.prisma.lead.update({
      where: { id },
      data: {
        ...dto,
        budget: dto.budget ? new Prisma.Decimal(dto.budget) : null,
      },
    });

    await this.activityService.create(
      {
        entityType: ActivityEntity.LEAD,
        entityId: lead.id,
        action: 'LEAD_UPDATED',
        description: `Lead "${lead.name}" updated.`,
        metadata: {
          before: oldLead,
          after: lead,
        },
      },
      authUserId,
    );

    await this.aiService.update({
      entityId: lead.id,
      entityType: ActivityEntity.LEAD,
      title: lead.title ?? "",
      content: leadToDocument(lead),
    });

    if (lead.ownerId && oldLead && oldLead.ownerId !== lead.ownerId) {
      await this.notificationService.create({
        title: 'Lead Reassigned',
        message: `Lead "${lead.name}" has been reassigned to you.`,
        type: 'LEAD',
        module: 'LEAD',
        entityId: lead.id,
        createdBy: authUserId,
        userIds: [lead.ownerId],
      });
    }

    if (lead.isConverted && oldLead && !oldLead.isConverted) {
      await this.notificationService.create({
        title: 'Lead Converted',
        message: `Lead "${lead.name}" has been successfully converted.`,
        type: 'LEAD',
        module: 'LEAD',
        entityId: lead.id,
        createdBy: authUserId,
        userIds: [lead.ownerId || authUserId],
      });
    }

    return lead;
  }

  async delete(id: number, authUserId: number) {
    const lead = await this.prisma.lead.delete({
      where: { id },
    });

    await this.activityService.create({
      entityType: ActivityEntity.LEAD,
      entityId: lead.id,
      action: 'LEAD_DELETED',
      description: `Lead "${lead.name}" deleted.`,
      metadata: {
        name: lead.name,
        email: lead.email,
      },
    },
      authUserId);

    return lead;
  }

  async createDefaultLeadView(userId: number) {
    const leadModule = await this.prisma.module.findUnique({
      where: {
        path: '/leads',
      },
    });
    if (!leadModule) return;
    await this.prisma.userTableView.create({
      data: {
        userId: userId,
        moduleId: leadModule.id,
        name: 'Default',
        isDefault: true,
        columns: {
          create: [
            { field: 'id', label: 'ID', visible: true, order: 1 },
            { field: 'openActivity', label: 'Open Activity', visible: true, order: 2 },
            { field: 'createdById', label: 'Created By', visible: false, order: 3, },
            { field: 'name', label: 'Name', visible: true, order: 4 },
            { field: 'title', label: 'Title', visible: false, order: 5 },
            { field: 'email', label: 'Email', visible: true, order: 6 },
            { field: 'phone', label: 'Phone', visible: true, order: 7 },
            { field: 'website', label: 'Website', visible: true, order: 8 },
            { field: 'city', label: 'City', visible: true, order: 9 },
            { field: 'state', label: 'State', visible: false, order: 10 },
            { field: 'pinCode', label: 'Pin Code', visible: false, order: 11 },
            { field: 'country', label: 'Country', visible: false, order: 12 },
            { field: 'address', label: 'Address', visible: false, order: 13 },
            { field: 'industry', label: 'Industry', visible: false, order: 14 },
            { field: 'source', label: 'Source', visible: false, order: 15 },
            { field: 'budget', label: 'Budget', visible: false, order: 16 },
            { field: 'priority', label: 'Priority', visible: false, order: 17 },
            { field: 'rating', label: 'Rating', visible: false, order: 18 },
            { field: 'leadScore', label: 'LeadScore', visible: false, order: 19 },
            { field: 'isQualified', label: 'Is Qualified', visible: false, order: 20, },
            { field: 'isConverted', label: 'Is Converted', visible: false, order: 21, },
            { field: 'assignedToId', label: 'Assigned To', visible: false, order: 22, },
            { field: 'nextFollowUpDate', label: 'Next FollowUp Date', visible: false, order: 23, },
            { field: 'lastFollowUpDate', label: 'Last FollowUp Date', visible: false, order: 24, },
            { field: 'status', label: 'Status', visible: true, order: 25 },
            { field: 'createdAt', label: 'Created At', visible: false, order: 26, },
            { field: 'updatedAt', label: 'Updated At', visible: false, order: 27, },
            { field: 'action', label: 'Action', visible: true, order: 28 },
          ],
        },
      },
    });
  }

  async viewSetting(authUserId: number) {
    const leadModule = await this.prisma.module.findFirst({
      where: {
        path: '/leads',
      },
    });
    if (!leadModule) return;
    const viewSetting = await this.prisma.userTableView.findFirst({
      where: {
        userId: authUserId,
        isDefault: true,
        moduleId: leadModule.id,
      },
      include: {
        columns: true,
      },
    });

    if (!viewSetting) {
      await this.createDefaultLeadView(authUserId);
      return this.prisma.userTableView.findFirst({
        where: {
          userId: authUserId,
          isDefault: true,
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
    const deletedLeads: any[] = [];
    for (const id of ids) {
      const deleted = await this.delete(id, authUserId);
      deletedLeads.push(deleted);
    }
    return deletedLeads;
  }

  async bulkUpdate(ids: number[], data: any, authUserId: number) {
    const whitelistedKeys = [
      'status',
      'priority',
      'rating',
      'source',
      'industry',
      'city',
      'state',
      'pinCode',
      'country',
      'address',
      'budget',
      'requirement',
      'description',
      'leadScore',
    ];

    const cleanData = {};
    for (const key of Object.keys(data)) {
      if (whitelistedKeys.includes(key)) {
        cleanData[key] = data[key];
      }
    }

    const updatedLeads: any[] = [];
    for (const id of ids) {
      const updated = await this.update(cleanData as any, id, authUserId);
      updatedLeads.push(updated);
    }
    return updatedLeads;
  }
}

