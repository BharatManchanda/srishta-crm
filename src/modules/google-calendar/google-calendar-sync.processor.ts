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
      case 'delete-calendar-event':
        await this.googleCalendarService.deleteEvent(job.data.userId, job.data.googleEventId);
        break;
      case 'sync-all-user-events':
        await this.syncAllUserEvents(job.data.userId);
        break;
      case 'manual-sync-all-user-events':
        await this.manualSyncAllUserEvents(job.data.userId);
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

    try {
      if (meeting.googleEventId) {
        const event = await this.googleCalendarService.updateEvent(meeting.createdById, meeting.googleEventId, {
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

        this.logger.log(`Meeting ${meeting.id} updated successfully on Google Calendar.`);
      } else {
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
      }
    } catch (error: any) {
      this.logger.error(`Meeting ${meeting.id} sync failed: ${error.message}`, error.stack);
      await this.prisma.meeting.update({
        where: { id: meeting.id },
        data: {
          googleSyncStatus: 'FAILED',
        },
      });
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

    try {
      const start = new Date(task.dueDate);
      start.setHours(9, 0, 0);

      const end = new Date(start);
      end.setHours(10, 0, 0);

      if (task.googleEventId) {
        const event = await this.googleCalendarService.updateEvent(task.createdById, task.googleEventId, {
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

        this.logger.log(`Task ${task.id} updated successfully on Google Calendar.`);
      } else {
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
      }
    } catch (error: any) {
      this.logger.error(`Task ${task.id} sync failed: ${error.message}`, error.stack);
      await this.prisma.task.update({
        where: { id: task.id },
        data: {
          googleSyncStatus: 'FAILED',
        },
      });
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

    try {
      const end = new Date(call.callStartTime.getTime() + call.callDuration * 60000);

      if (call.googleEventId) {
        const event = await this.googleCalendarService.updateEvent(call.createdById, call.googleEventId, {
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

        this.logger.log(`Call ${call.id} updated successfully on Google Calendar.`);
      } else {
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
      }
    } catch (error: any) {
      this.logger.error(`Call ${call.id} sync failed: ${error.message}`, error.stack);
      await this.prisma.call.update({
        where: { id: call.id },
        data: {
          googleSyncStatus: 'FAILED',
        },
      });
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

  private async manualSyncAllUserEvents(userId: number) {
    this.logger.log(`Manual sync initiated for user ${userId}`);

    // 1. Find all user's meetings, calls, tasks that have a googleEventId
    const meetings = await this.prisma.meeting.findMany({
      where: { createdById: userId, googleEventId: { not: null } },
      select: { id: true, googleEventId: true },
    });

    const calls = await this.prisma.call.findMany({
      where: { createdById: userId, googleEventId: { not: null } },
      select: { id: true, googleEventId: true },
    });

    const tasks = await this.prisma.task.findMany({
      where: { createdById: userId, googleEventId: { not: null } },
      select: { id: true, googleEventId: true },
    });

    // 2. Delete them from Google Calendar (ignore 404/410 errors)
    for (const m of meetings) {
      if (m.googleEventId) {
        try {
          await this.googleCalendarService.deleteEvent(userId, m.googleEventId);
        } catch (err: any) {
          this.logger.error(`Failed to delete meeting event ${m.googleEventId}: ${err.message}`);
        }
      }
    }

    for (const c of calls) {
      if (c.googleEventId) {
        try {
          await this.googleCalendarService.deleteEvent(userId, c.googleEventId);
        } catch (err: any) {
          this.logger.error(`Failed to delete call event ${c.googleEventId}: ${err.message}`);
        }
      }
    }

    for (const t of tasks) {
      if (t.googleEventId) {
        try {
          await this.googleCalendarService.deleteEvent(userId, t.googleEventId);
        } catch (err: any) {
          this.logger.error(`Failed to delete task event ${t.googleEventId}: ${err.message}`);
        }
      }
    }

    // 3. Reset all googleEventId/sync status to null in database
    await this.prisma.meeting.updateMany({
      where: { createdById: userId },
      data: {
        googleEventId: null,
        googleSyncStatus: 'PENDING',
        googleSyncedAt: null,
      },
    });

    await this.prisma.call.updateMany({
      where: { createdById: userId },
      data: {
        googleEventId: null,
        googleSyncStatus: 'PENDING',
        googleSyncedAt: null,
      },
    });

    await this.prisma.task.updateMany({
      where: { createdById: userId },
      data: {
        googleEventId: null,
        googleSyncStatus: 'PENDING',
        googleSyncedAt: null,
      },
    });

    // 4. Trigger standard sync-all-user-events
    await this.syncAllUserEvents(userId);
  }
}
