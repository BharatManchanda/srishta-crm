import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { ActivityService } from '../activity/activity.service';
import { AiService } from '../ai/ai.service';
import { NotificationService } from '../notification/notification.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { ActivityEntity, AiEntityType, AttachmentOwnerType, CallEntityType, MeetingEntityType, NoteEntityType, NotificationType, Prisma, TaskEntityType, WhatsappEntityType } from '@prisma/client';
import { DealFilterBuilder } from './deal-filter.builder';
import { DealFilterDto } from './dto/deal-filter.dto';
import { DealCreateDto } from './dto/deal-create.dto';
import { DealUpdateDto } from './dto/deal-update.dto';
import { UpdateViewSettingDto } from './dto/update-view-setting.dto';
import { dealToDocument } from 'src/common/helpers/build-document';

@Injectable()
export class DealService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly paginationService: PaginationService,
        private readonly dealFilterBuilder: DealFilterBuilder,
        private readonly userHierarchyService: UserHierarchyService,
        private readonly activityService: ActivityService,
        private readonly aiService: AiService,
        private readonly notificationService: NotificationService,
        private readonly whatsappService: WhatsappService
    ) { }
    async getList(dto: DealFilterDto, currentUserId: number) {
        const user = await this.prisma.user.findUnique({
            where: { id: currentUserId },
            select: { accessLevel: true },
        });
    
        const where: any = {
            ...this.dealFilterBuilder.build(dto),
            id: {
                in: dto.id !== undefined && dto.id ? [dto?.id] : undefined,
            },
        }
    
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
        const result = await this.paginationService.paginate(this.prisma.deal, {
            page: dto.page,
            perPage: dto.perPage,
            paginate: dto?.paginate,
            where,
            include: {
                createdBy: true,
            },
            orderBy,
        });
    
        const dealIds = result.data.map((deal: any) => deal.id);
        if (dealIds.length > 0) {
            const [tasks, calls, meetings] = await Promise.all([
                this.prisma.task.findMany({
                    where: {
                        entityType: 'DEAL',
                        entityId: { in: dealIds },
                        status: { not: 'COMPLETED' },
                    },
                }),
                this.prisma.call.findMany({
                    where: {
                        entityType: 'DEAL',
                        entityId: { in: dealIds },
                        status: { not: 'COMPLETED' },
                    },
                }),
                this.prisma.meeting.findMany({
                    where: {
                        entityType: 'DEAL',
                        entityId: { in: dealIds },
                        endTime: { gte: new Date() },
                    },
                }),
            ]);
    
            result.data = result.data.map((deal: any) => {
                const dealTasks = tasks.filter((t) => t.entityId === deal.id);
                const dealCalls = calls.filter((c) => c.entityId === deal.id);
                const dealMeetings = meetings.filter((m) => m.entityId === deal.id);
        
                return {
                    ...deal,
                    openActivities: {
                        tasks: dealTasks,
                        calls: dealCalls,
                        meetings: dealMeetings,
                    },
                };
            });
        }
    
        return result;
    }
    
    async create(dto: DealCreateDto, authUserId: number) {
        const deal = await this.prisma.deal.create({
          data: {
            ...dto,
            createdById: authUserId,
            ownerId: dto.ownerId || authUserId,
          },
          include: {
            owner: true,
          },
        });
    
        await this.activityService.create({
          entityType: ActivityEntity.DEAL,
          entityId: deal.id,
          action: 'DEAL_CREATED',
          description: `Deal "${deal.name}" created.`,
          metadata: {
            name: deal.name,
            stage: deal.stage,
          },
        }, authUserId);
    
        await this.aiService.create({
          entityType: AiEntityType.DEAL,
          entityId: deal.id,
          title: deal.name ?? "",
          content: dealToDocument(deal),
        }, authUserId);
    
        if (deal.ownerId && deal.ownerId !== authUserId) {
          await this.notificationService.create({
            title: 'Deal Assigned',
            message: `Deal "${deal.name}" has been assigned to you.`,
            type: NotificationType.DEAL,
            module: 'DEAL',
            entityId: deal.id,
            createdBy: authUserId,
            userIds: [deal.ownerId],
          });
    
          if (deal.owner && deal.owner.phone) {
            await this.whatsappService.sendMessage({
              message: `Deal "${deal.name}" has been assigned to you.`,
              entityType: WhatsappEntityType.DEAL,
              entityId: deal.id,
              to: deal.owner.phone
            }, authUserId)
          }
        }
    
        return deal;
    }
    
    async get(id: number, authUserId: number) {
        // const createdById = await this.userHierarchyService.getFamilyUserIds(authUserId);
        const user = await this.prisma.user.findUnique({
          where: { id: authUserId },
          select: { accessLevel: true },
        });
    
        let ownerId: number | undefined = undefined;
        if (user?.accessLevel === 'STANDARD') {
          ownerId = authUserId;
        }
    
        const [deal, notes, attachments, tasks, calls, meetings] = await this.prisma.$transaction([
            this.prisma.deal.findUnique({
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
                    contact: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    account: {
                        select: {
                            id: true,
                            accountName: true,
                        },
                    },
                },
            }),
    
            this.prisma.note.count({
                where: {
                    entityType: NoteEntityType.DEAL,
                    entityId: id,
                },
            }),
    
            this.prisma.attachment.count({
                where: {
                    entityType: AttachmentOwnerType.DEAL,
                    entityId: id,
                },
            }),
    
            this.prisma.task.count({
                where: {
                    entityType: TaskEntityType.DEAL,
                    entityId: id,
                    ownerId
                },
            }),
    
            this.prisma.call.count({
                where: {
                    entityType: CallEntityType.DEAL,
                    entityId: id,
                    ownerId
                },
            }),
    
            this.prisma.meeting.count({
                where: {
                    entityType: MeetingEntityType.DEAL,
                    entityId: id,
                },
            }),
        ]);
    
        return {
            ...deal,
            counts: {
                notes,
                attachments,
                tasks,
                calls,
                meetings,
            },
        };
    }
    
    async update(dto: DealUpdateDto, id: number, authUserId: number) {
        const oldDeal = await this.prisma.deal.findUnique({ where: { id } });
    
        const deal = await this.prisma.deal.update({
            where: { id },
            data: {
                ...dto,
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                    },
                },
            },
        });
    
        await this.activityService.create(
            {
                entityType: ActivityEntity.DEAL,
                entityId: deal.id,
                action: 'DEAL_UPDATED',
                description: `Deal "${deal.name}" updated.`,
                metadata: {
                    before: oldDeal,
                    after: deal,
                },
            },
            authUserId,
        );
    
        await this.aiService.update({
            entityId: deal.id,
            entityType: ActivityEntity.DEAL,
            title: deal.name ?? "",
            content: dealToDocument(deal),
        }, authUserId);
    
        if (deal.ownerId && oldDeal && oldDeal.ownerId !== deal.ownerId) {
            await this.notificationService.create({
                title: 'Deal Reassigned',
                message: `Deal "${deal.name}" has been reassigned to you.`,
                type: NotificationType.DEAL,
                module: 'DEAL',
                entityId: deal.id,
                createdBy: authUserId,
                userIds: [deal.ownerId],
            });
            if (deal.owner && deal.owner.phone) {
                await this.whatsappService.sendMessage({
                    message: `Deal "${deal.name}" has been assigned to you.`,
                    entityType: WhatsappEntityType.DEAL,
                    entityId: deal.id,
                    to: deal.owner.phone
                }, authUserId)
            }
        }
    
        // if (deal.isConverted && oldDeal && !oldDeal.isConverted) {
        //     await this.notificationService.create({
        //         title: 'Deal Converted',
        //         message: `Deal "${deal.name}" has been successfully converted.`,
        //         type: NotificationType.DEAL,
        //         module: 'DEAL',
        //         entityId: deal.id,
        //         createdBy: authUserId,
        //         userIds: [deal.ownerId || authUserId],
        //     });
    
        //     if (deal.owner && deal.owner.phone) {
        //         await this.whatsappService.sendMessage({
        //             message: `Deal "${deal.name}" has been assigned to you.`,
        //             entityType: WhatsappEntityType.DEAL,
        //             entityId: deal.id,
        //             to: deal.owner.phone
        //         }, authUserId)
        //     }
        // }
    
        return deal;
    }
    
    async delete(id: number, authUserId: number) {
        const deal = await this.prisma.deal.delete({
            where: { id },
        });
    
        await this.activityService.create({
            entityType: ActivityEntity.DEAL,
            entityId: deal.id,
            action: 'DEAL_DELETED',
            description: `Deal "${deal.name}" deleted.`,
            metadata: {
                name: deal.name,
                stage: deal.stage,
            },
        },
        authUserId);
    
        return deal;
    }

    async createDefaultDealView(userId: number) {
        const dealModule = await this.prisma.module.findUnique({
            where: {
                path: '/deals',
            },
        });
        if (!dealModule) return;
        await this.prisma.userTableView.create({
            data: {
                userId: userId,
                moduleId: dealModule.id,
                name: 'Default',
                isDefault: true,
                columns: {
                    create: [
                        { field: 'id', label: 'ID', visible: true, order: 1 },
                        { field: 'openActivity', label: 'Open Activity', visible: true, order: 2 },
                        { field: 'createdById', label: 'Created By', visible: false, order: 3, },
                        { field: 'name', label: 'Name', visible: true, order: 4 },
                        { field: 'amount', label: 'Amount', visible: false, order: 5 },
                        { field: 'leadSource', label: 'Lead Source', visible: true, order: 6 },
                        { field: 'stage', label: 'Stage', visible: true, order: 7 },
                        { field: 'probability', label: 'Probability', visible: true, order: 8 },
                        { field: 'closingDate', label: 'Closing Date', visible: true, order: 9 },
                        { field: 'socialLeadId', label: 'Social Lead ID', visible: false, order: 10 },
                        { field: 'ownerId', label: 'Owner', visible: false, order: 11 },
                        { field: 'accountId', label: 'Account', visible: false, order: 12 },
                        { field: 'contactId', label: 'Contact', visible: false, order: 13 },
                        { field: 'type', label: 'Deal Type', visible: false, order: 14 },
                        { field: 'nextStep', label: 'Next Step', visible: false, order: 15 },
                        { field: 'createdAt', label: 'Created At', visible: false, order: 16, },
                        { field: 'updatedAt', label: 'Updated At', visible: false, order: 17, },
                        { field: 'action', label: 'Action', visible: true, order: 18 },
                    ],
                },
            },
        });
    }

    async viewSetting(authUserId: number) {
        const dealModule = await this.prisma.module.findFirst({
            where: {
                path: '/deals',
            },
        });
        if (!dealModule) return;
        const viewSetting = await this.prisma.userTableView.findFirst({
            where: {
                userId: authUserId,
                isDefault: true,
                moduleId: dealModule.id,
            },
            include: {
                columns: true,
            },
        });

        if (!viewSetting) {
            await this.createDefaultDealView(authUserId);
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
        const deletedDeals: any[] = [];
        for (const id of ids) {
            const deleted = await this.delete(id, authUserId);
            deletedDeals.push(deleted);
        }
        return deletedDeals;
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

        const updatedDeals: any[] = [];
        for (const id of ids) {
            const updated = await this.update(cleanData as any, id, authUserId);
            updatedDeals.push(updated);
        }
        return updatedDeals;
    }
}
