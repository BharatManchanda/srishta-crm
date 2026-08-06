import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from './notification.service';
import { WhatsappEntityType } from '@prisma/client';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class FollowUpCronService {
  private readonly logger = new Logger(FollowUpCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly whatsappService: WhatsappService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkFollowUps() {
    this.logger.log('Checking follow-ups...');
    const now = new Date();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    try {
      // 1. Follow-up Reminder (leads with follow-up scheduled for today)
      const reminderLeads = await this.prisma.lead.findMany({
        where: {
          nextFollowUpDate: {
            gte: startOfToday,
            lte: endOfToday,
          },
          isConverted: false,
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          createdBy: true
        },
      });

      for (const lead of reminderLeads) {
        if (!lead.ownerId) continue;

        // Check if already sent a reminder today
        const alreadySent = await this.prisma.notification.findFirst({
          where: {
            title: 'Follow-up Reminder',
            entityId: lead.id,
            module: 'LEAD',
            createdAt: {
              gte: startOfToday,
            },
          },
        });

        if (!alreadySent) {
          await this.notificationService.create({
            title: 'Follow-up Reminder',
            message: `You have a follow-up scheduled today for lead "${lead.name}".`,
            type: 'LEAD',
            module: 'LEAD',
            entityId: lead.id,
            userIds: [lead.ownerId],
          });

          let authUserId = lead.createdById;

          if (!lead.createdBy.isSuperAdmin && lead.createdBy.parentId) {
            authUserId = lead.createdBy.parentId;
          }

          if (lead.owner && lead.owner.phone) {
            await this.whatsappService.sendMessage({
              message: `You have a follow-up scheduled today for lead "${lead.name}".`,
              entityType: WhatsappEntityType.LEAD,
              entityId: lead.id,
              to: lead.owner.phone
            }, authUserId)
          }
        }
      }

      // 2. Follow-up Overdue (leads with nextFollowUpDate in the past)
      const overdueLeads = await this.prisma.lead.findMany({
        where: {
          nextFollowUpDate: {
            lt: now,
          },
          isConverted: false,
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          createdBy: true
        },
      });

      for (const lead of overdueLeads) {
        if (!lead.ownerId) continue;

        // Check if already sent an overdue notification
        const alreadySent = await this.prisma.notification.findFirst({
          where: {
            title: 'Follow-up Overdue',
            entityId: lead.id,
            module: 'LEAD',
          },
        });

        if (!alreadySent) {
          await this.notificationService.create({
            title: 'Follow-up Overdue',
            message: `Follow-up is overdue for lead "${lead.name}". It was scheduled for ${lead.nextFollowUpDate?.toLocaleDateString()}.`,
            type: 'LEAD',
            module: 'LEAD',
            entityId: lead.id,
            userIds: [lead.ownerId],
          });

          if (lead.owner && lead.owner.phone) {
            let authUserId = lead.createdById;

            if (!lead.createdBy.isSuperAdmin && lead.createdBy.parentId) {
              authUserId = lead.createdBy.parentId;
            }
            
            await this.whatsappService.sendMessage({
              message: `Follow-up is overdue for lead "${lead.name}". It was scheduled for ${lead.nextFollowUpDate?.toLocaleDateString()}.`,
              entityType: WhatsappEntityType.LEAD,
              entityId: lead.id,
              to: lead.owner.phone
            }, authUserId)
          }
        }
      }
    } catch (err) {
      this.logger.error('Error checking follow-ups:', err);
    }
  }
}
