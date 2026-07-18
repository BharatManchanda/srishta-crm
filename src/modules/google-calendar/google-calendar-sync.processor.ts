import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleCalendarService } from './google-calendar.service';

@Injectable()
@Processor('google-calendar-sync')
export class GoogleCalendarSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(GoogleCalendarSyncProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly googleCalendarService: GoogleCalendarService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing job ${job.name} with ID ${job.id}`);

    switch (job.name) {
      case 'sync-meeting':
        await this.syncMeeting(job.data.meetingId);
        break;
      case 'sync-task':
        await this.syncTask(job.data.taskId);
        break;
      case 'sync-call':
        await this.syncCall(job.data.callId);
        break;
      case 'sync-all-user-events':
        await this.syncAllUserEvents(job.data.userId);
        break;
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async syncMeeting(meetingId: number) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        createdBy: {
          include: {
            connectedGoogleCalendar: true,
          },
        },
      },
    });

    if (!meeting) {
      this.logger.warn(`Meeting ${meetingId} not found.`);
      return;
    }

    if (!meeting.createdBy.connectedGoogleCalendar || meeting.createdBy.connectedGoogleCalendar.length === 0) {
      this.logger.log(`User ${meeting.createdById} does not have a connected Google Calendar. Skipping meeting sync.`);
      return;
    }

    if (meeting.googleEventId) {
      this.logger.log(`Meeting ${meetingId} is already synced.`);
      return;
    }

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

      this.logger.log(`Meeting ${meeting.id} synced successfully.`);
    } catch (error: any) {
      this.logger.error(`Meeting ${meeting.id} sync failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async syncTask(taskId: number) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        createdBy: {
          include: {
            connectedGoogleCalendar: true,
          },
        },
      },
    });

    if (!task) {
      this.logger.warn(`Task ${taskId} not found.`);
      return;
    }

    if (!task.createdBy.connectedGoogleCalendar || task.createdBy.connectedGoogleCalendar.length === 0) {
      this.logger.log(`User ${task.createdById} does not have a connected Google Calendar. Skipping task sync.`);
      return;
    }

    if (!task.dueDate) {
      this.logger.log(`Task ${taskId} has no due date. Skipping sync.`);
      return;
    }

    if (task.googleEventId) {
      this.logger.log(`Task ${taskId} is already synced.`);
      return;
    }

    try {
      const start = new Date(task.dueDate);
      start.setHours(9, 0, 0);

      const end = new Date(start);
      end.setHours(10, 0, 0);

      const event = await this.googleCalendarService.createEvent(task.createdById, {
        summary: `Task: ${task.subject}`,
        description: task.description ?? '',
        start: start.toISOString(),
        end: end.toISOString(),
      });

      await this.prisma.task.update({
        where: { id: task.id },
        data: {
          googleEventId: event.id,
          googleSyncedAt: new Date(),
          googleSyncStatus: 'SYNCED',
        },
      });

      this.logger.log(`Task ${task.id} synced successfully.`);
    } catch (error: any) {
      this.logger.error(`Task ${task.id} sync failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async syncCall(callId: number) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
      include: {
        createdBy: {
          include: {
            connectedGoogleCalendar: true,
          },
        },
      },
    });

    if (!call) {
      this.logger.warn(`Call ${callId} not found.`);
      return;
    }

    if (!call.createdBy.connectedGoogleCalendar || call.createdBy.connectedGoogleCalendar.length === 0) {
      this.logger.log(`User ${call.createdById} does not have a connected Google Calendar. Skipping call sync.`);
      return;
    }

    if (!call.callStartTime) {
      this.logger.log(`Call ${callId} has no start time. Skipping sync.`);
      return;
    }

    if (call.googleEventId) {
      this.logger.log(`Call ${callId} is already synced.`);
      return;
    }

    try {
      const end = new Date(call.callStartTime.getTime() + call.callDuration * 60000);

      const event = await this.googleCalendarService.createEvent(call.createdById, {
        summary: `Call: ${call.subject}`,
        description: call.description ?? '',
        start: call.callStartTime.toISOString(),
        end: end.toISOString(),
      });

      await this.prisma.call.update({
        where: { id: call.id },
        data: {
          googleEventId: event.id,
          googleSyncedAt: new Date(),
          googleSyncStatus: 'SYNCED',
        },
      });

      this.logger.log(`Call ${call.id} synced successfully.`);
    } catch (error: any) {
      this.logger.error(`Call ${call.id} sync failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async syncAllUserEvents(userId: number) {
    this.logger.log(`Syncing all unsynced events for user ${userId}`);

    // Get unsynced meetings
    const meetings = await this.prisma.meeting.findMany({
      where: {
        createdById: userId,
        googleEventId: null,
      },
    });
    for (const meeting of meetings) {
      await this.syncMeeting(meeting.id);
    }

    // Get unsynced calls
    const calls = await this.prisma.call.findMany({
      where: {
        createdById: userId,
        googleEventId: null,
        callStartTime: { not: null },
      },
    });
    for (const call of calls) {
      await this.syncCall(call.id);
    }

    // Get unsynced tasks
    const tasks = await this.prisma.task.findMany({
      where: {
        createdById: userId,
        googleEventId: null,
        dueDate: { not: null },
      },
    });
    for (const task of tasks) {
      await this.syncTask(task.id);
    }
  }
}
