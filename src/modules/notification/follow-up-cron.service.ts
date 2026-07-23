import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from './notification.service';

@Injectable()
export class FollowUpCronService {
  private readonly logger = new Logger(FollowUpCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
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
        }
      }
    } catch (err) {
      this.logger.error('Error checking follow-ups:', err);
    }
  }
}
