import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GoogleCalendarService } from '../../modules/google-calendar/google-calendar.service';
import { PrismaService } from '../../modules/prisma/prisma.service';

@Injectable()
export class GoogleCalendarSyncService {
  private readonly logger = new Logger(GoogleCalendarSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly googleCalendarService: GoogleCalendarService,
  ) { }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async GoogleCalendarSyncEvents() {
    this.logger.log('Starting Google Calendar Sync...');

    await this.syncMeetings();
    await this.syncCalls();
    await this.syncTasks();

    this.logger.log('Google Calendar Sync Completed.');
  }

  private async syncMeetings() {
    const meetings = await this.prisma.meeting.findMany({
      where: {
        googleEventId: null,
        createdBy: {
          connectedGoogleCalendar: {
            some: {},
          },
        },
      },
    });

    for (const meeting of meetings) {
      try {
        const event = await this.googleCalendarService.createEvent(meeting.createdById, {
          summary: meeting.title,
          description: meeting.description ?? '',
          location: meeting.location ?? '',
          start: meeting.startTime.toISOString(),
          end: meeting.endTime.toISOString(),
        });

        await this.prisma.meeting.update({
          where: { id: meeting.id },
          data: {
            googleEventId: event.id,
            googleSyncedAt: new Date(),
            googleSyncStatus: 'SYNCED',
          },
        });

        this.logger.log(`Meeting ${meeting.id} synced.`);
      } catch (error: any) {
        this.logger.error(
          `Meeting ${meeting.id} sync failed`,
          error.stack,
        );
      }
    }
  }

  private async syncCalls() {
    const calls = await this.prisma.call.findMany({
      where: {
        googleEventId: null,
        callStartTime: {
          not: null,
        },
        createdBy: {
          connectedGoogleCalendar: {
            some: {},
          },
        },
      },
    });

    for (const call of calls) {
      try {
        const end = new Date(
          call.callStartTime!.getTime() + call.callDuration * 60000,
        );

        const event = await this.googleCalendarService.createEvent(
          call.createdById,
          {
            summary: `Call: ${call.subject}`,
            description: call.description ?? '',
            start: call.callStartTime!.toISOString(),
            end: end.toISOString(),
          },
        );

        await this.prisma.call.update({
          where: { id: call.id },
          data: {
            googleEventId: event.id,
            googleSyncedAt: new Date(),
            googleSyncStatus: 'SYNCED',
          },
        });

        this.logger.log(`Call ${call.id} synced.`);
      } catch (error: any) {
        this.logger.error(
          `Call ${call.id} sync failed`,
          error.stack,
        );
      }
    }
  }

  private async syncTasks() {
    const tasks = await this.prisma.task.findMany({
      where: {
        googleEventId: null,
        dueDate: {
          not: null,
        },
        createdBy: {
          connectedGoogleCalendar: {
            some: {},
          },
        },
      },
    });

    for (const task of tasks) {
      try {
        const start = new Date(task.dueDate!);
        start.setHours(9, 0, 0);

        const end = new Date(start);
        end.setHours(10, 0, 0);

        const event = await this.googleCalendarService.createEvent(
          task.createdById,
          {
            summary: `Task: ${task.subject}`,
            description: task.description ?? '',
            start: start.toISOString(),
            end: end.toISOString(),
          },
        );

        await this.prisma.task.update({
          where: { id: task.id },
          data: {
            googleEventId: event.id,
            googleSyncedAt: new Date(),
            googleSyncStatus: 'SYNCED',
          },
        });

        this.logger.log(`Task ${task.id} synced.`);
      } catch (error: any) {
        this.logger.error(
          `Task ${task.id} sync failed`,
          error.stack,
        );
      }
    }
  }
}
