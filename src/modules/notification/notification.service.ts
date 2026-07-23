import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/notification-create.dto';
import { NotificationGateway } from './notification.gateway';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { NotificationStatus } from '@prisma/client';

@Injectable()
export class NotificationService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly gateway: NotificationGateway,
        private readonly paginationService: PaginationService
    ) { }

    async getList(userId: number, dto: PaginationDto) {
        return this.paginationService.paginate(this.prisma.notificationRecipient, {
            page: dto.page,
            perPage: dto.perPage,
            where: {
                userId,
            },
            include: {
                notification: true,
            },
            orderBy: {
                notification: {
                    createdAt: "desc",
                },
            },
        });
    }

    async create(dto: CreateNotificationDto) {
        const notification = await this.prisma.notification.create({
            data: {
                title: dto.title,
                message: dto.message,
                type: dto.type,
                module: dto.module,
                entityId: dto.entityId,
                createdById: dto.createdBy,

                recipients: {
                    createMany: {
                        data: dto.userIds.map(userId => ({
                            userId
                        }))
                    }
                }
            },
            include: {
                recipients: true
            }
        });

        for (const recipient of notification.recipients) {
            this.gateway.notifyUser(recipient.userId, {
                id: notification.id,
                title: notification.title,
                message: notification.message,
                type: notification.type,
                module: notification.module,
                entityId: notification.entityId,
                status: recipient.status,
                createdAt: notification.createdAt,
            });
        }

        return notification;
    }

    async unreadCount(userId: number) {
        return this.prisma.notificationRecipient.count({
            where: {
                userId,
                status: 'UNREAD'
            }
        });
    }

    async markAsRead(userId: number, notificationId: number) {
        return await this.prisma.notificationRecipient.update({
            where: {
                notificationId_userId: {
                    notificationId,
                    userId
                }
            },
            data: {
                status: 'READ',
                readAt: new Date()
            }
        });
    }

    async markAllAsRead(userId: number, type?: 'all' | 'unread') {
        return await this.prisma.notificationRecipient.updateMany({
            where: {
                userId,
                ...(type === 'unread' && { status: 'UNREAD' }),
            },
            data: {
                status: 'READ',
                readAt: new Date()
            }
        });
    }

    async archive(userId: number, notificationId: number) {
        return await this.prisma.notificationRecipient.update({
            where: {
                notificationId_userId: {
                    notificationId,
                    userId
                }
            },
            data: {
                status: NotificationStatus.ARCHIVED,
            }
        });
    }

}
