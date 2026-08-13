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
      case 'sync-access-level-change':
        await this.syncAccessLevelChange(job.data.userId);
        break;
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async syncMeeting(meetingId: number) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        participants: true,
      },
    });

    if (!meeting) {
      this.logger.warn(`Meeting ${meetingId} not found.`);
      return;
    }

    const participantsUserIds = meeting.participants
      .filter((p) => p.participantType === 'USER' && p.participantId)
      .map((p) => p.participantId!);

    // Find all administrative users + standard users in the participants list
    const eligibleUsers = await this.prisma.user.findMany({
      where: {
        OR: [
          { accessLevel: 'ADMINISTRATIVE' },
          { id: { in: participantsUserIds } },
        ],
      },
      select: {
        id: true,
      },
    });

    const eligibleUserIds = eligibleUsers.map((u) => u.id);

    // Get only those users who have a connected Google Calendar
    const connectedCalendars = await this.prisma.googleCalendar.findMany({
      where: {
        connectedById: { in: eligibleUserIds },
      },
      select: {
        connectedById: true,
      },
    });

    const targetUserIds = connectedCalendars.map((c) => c.connectedById);

    // Process sync for eligible target users
    for (const userId of targetUserIds) {
      try {
        const syncRecord = await this.prisma.calendarSyncRecord.findUnique({
          where: {
            userId_entityType_entityId: {
              userId,
              entityType: 'MEETING',
              entityId: meetingId,
            },
          },
        });

        if (!meeting.startTime || !meeting.endTime) {
          this.logger.warn(`Meeting ${meetingId} has missing start or end time.`);
          return;
        }
        const eventData = {
          summary: meeting.title ?? "Meeting",
          description: meeting.description ?? '',
          location: meeting.location ?? '',
          start: meeting.startTime ? meeting.startTime.toISOString() : "N/A",
          end: meeting.endTime ? meeting.endTime.toISOString() : "N/A",
        };

        if (syncRecord?.googleEventId) {
          const event = await this.googleCalendarService.updateEvent(userId, syncRecord.googleEventId, eventData);
          await this.prisma.calendarSyncRecord.update({
            where: { id: syncRecord.id },
            data: {
              googleEventId: event.id,
              syncedAt: new Date(),
              syncStatus: 'SYNCED',
            },
          });
        } else {
          const event = await this.googleCalendarService.createEvent(userId, eventData);
          await this.prisma.calendarSyncRecord.upsert({
            where: {
              userId_entityType_entityId: {
                userId,
                entityType: 'MEETING',
                entityId: meetingId,
              },
            },
            update: {
              googleEventId: event.id,
              syncedAt: new Date(),
              syncStatus: 'SYNCED',
            },
            create: {
              userId,
              entityType: 'MEETING',
              entityId: meetingId,
              googleEventId: event.id,
              syncedAt: new Date(),
              syncStatus: 'SYNCED',
            },
          });
        }
      } catch (error: any) {
        this.logger.error(`Meeting ${meetingId} sync failed for user ${userId}: ${error.message}`, error.stack);
        await this.prisma.calendarSyncRecord.upsert({
          where: {
            userId_entityType_entityId: {
              userId,
              entityType: 'MEETING',
              entityId: meetingId,
            },
          },
          update: {
            syncStatus: 'FAILED',
          },
          create: {
            userId,
            entityType: 'MEETING',
            entityId: meetingId,
            syncStatus: 'FAILED',
          },
        });
      }
    }

    // Remove event from calendars of users who are no longer eligible
    const existingRecords = await this.prisma.calendarSyncRecord.findMany({
      where: {
        entityType: 'MEETING',
        entityId: meetingId,
      },
    });

    for (const record of existingRecords) {
      if (!targetUserIds.includes(record.userId)) {
        if (record.googleEventId) {
          try {
            await this.googleCalendarService.deleteEvent(record.userId, record.googleEventId);
          } catch (err: any) {
            this.logger.error(`Failed to delete meeting ${meetingId} event from user ${record.userId}: ${err.message}`);
          }
        }
        await this.prisma.calendarSyncRecord.delete({
          where: { id: record.id },
        });
      }
    }
  }

  private async syncTask(taskId: number) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      this.logger.warn(`Task ${taskId} not found.`);
      return;
    }

    if (!task.dueDate) {
      this.logger.log(`Task ${taskId} has no due date. Skipping sync.`);
      return;
    }

    const eligibleUsers = await this.prisma.user.findMany({
      where: {
        OR: [
          { accessLevel: 'ADMINISTRATIVE' },
          task.ownerId ? { id: task.ownerId } : undefined,
        ].filter(Boolean) as any,
      },
      select: {
        id: true,
      },
    });

    const eligibleUserIds = eligibleUsers.map((u) => u.id);

    const connectedCalendars = await this.prisma.googleCalendar.findMany({
      where: {
        connectedById: { in: eligibleUserIds },
      },
      select: {
        connectedById: true,
      },
    });

    const targetUserIds = connectedCalendars.map((c) => c.connectedById);

    const start = new Date(task.dueDate);
    start.setHours(9, 0, 0);

    const end = new Date(start);
    end.setHours(10, 0, 0);

    for (const userId of targetUserIds) {
      try {
        const syncRecord = await this.prisma.calendarSyncRecord.findUnique({
          where: {
            userId_entityType_entityId: {
              userId,
              entityType: 'TASK',
              entityId: taskId,
            },
          },
        });

        const eventData = {
          summary: `Task: ${task.subject}`,
          description: task.description ?? '',
          start: start.toISOString(),
          end: end.toISOString(),
        };

        if (syncRecord?.googleEventId) {
          const event = await this.googleCalendarService.updateEvent(userId, syncRecord.googleEventId, eventData);
          await this.prisma.calendarSyncRecord.update({
            where: { id: syncRecord.id },
            data: {
              googleEventId: event.id,
              syncedAt: new Date(),
              syncStatus: 'SYNCED',
            },
          });
        } else {
          const event = await this.googleCalendarService.createEvent(userId, eventData);
          await this.prisma.calendarSyncRecord.upsert({
            where: {
              userId_entityType_entityId: {
                userId,
                entityType: 'TASK',
                entityId: taskId,
              },
            },
            update: {
              googleEventId: event.id,
              syncedAt: new Date(),
              syncStatus: 'SYNCED',
            },
            create: {
              userId,
              entityType: 'TASK',
              entityId: taskId,
              googleEventId: event.id,
              syncedAt: new Date(),
              syncStatus: 'SYNCED',
            },
          });
        }
      } catch (error: any) {
        this.logger.error(`Task ${taskId} sync failed for user ${userId}: ${error.message}`, error.stack);
        await this.prisma.calendarSyncRecord.upsert({
          where: {
            userId_entityType_entityId: {
              userId,
              entityType: 'TASK',
              entityId: taskId,
            },
          },
          update: {
            syncStatus: 'FAILED',
          },
          create: {
            userId,
            entityType: 'TASK',
            entityId: taskId,
            syncStatus: 'FAILED',
          },
        });
      }
    }

    const existingRecords = await this.prisma.calendarSyncRecord.findMany({
      where: {
        entityType: 'TASK',
        entityId: taskId,
      },
    });

    for (const record of existingRecords) {
      if (!targetUserIds.includes(record.userId)) {
        if (record.googleEventId) {
          try {
            await this.googleCalendarService.deleteEvent(record.userId, record.googleEventId);
          } catch (err: any) {
            this.logger.error(`Failed to delete task ${taskId} event from user ${record.userId}: ${err.message}`);
          }
        }
        await this.prisma.calendarSyncRecord.delete({
          where: { id: record.id },
        });
      }
    }
  }

  private async syncCall(callId: number) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
    });

    if (!call) {
      this.logger.warn(`Call ${callId} not found.`);
      return;
    }

    if (!call.callStartTime) {
      this.logger.log(`Call ${callId} has no start time. Skipping sync.`);
      return;
    }

    const eligibleUsers = await this.prisma.user.findMany({
      where: {
        OR: [
          { accessLevel: 'ADMINISTRATIVE' },
          call.ownerId ? { id: call.ownerId } : undefined,
        ].filter(Boolean) as any,
      },
      select: {
        id: true,
      },
    });

    const eligibleUserIds = eligibleUsers.map((u) => u.id);

    const connectedCalendars = await this.prisma.googleCalendar.findMany({
      where: {
        connectedById: { in: eligibleUserIds },
      },
      select: {
        connectedById: true,
      },
    });

    const targetUserIds = connectedCalendars.map((c) => c.connectedById);

    const end = new Date(call.callStartTime.getTime() + call.callDuration * 60000);

    for (const userId of targetUserIds) {
      try {
        const syncRecord = await this.prisma.calendarSyncRecord.findUnique({
          where: {
            userId_entityType_entityId: {
              userId,
              entityType: 'CALL',
              entityId: callId,
            },
          },
        });

        const eventData = {
          summary: `Call: ${call.subject}`,
          description: call.description ?? '',
          start: call.callStartTime.toISOString(),
          end: end.toISOString(),
        };

        if (syncRecord?.googleEventId) {
          const event = await this.googleCalendarService.updateEvent(userId, syncRecord.googleEventId, eventData);
          await this.prisma.calendarSyncRecord.update({
            where: { id: syncRecord.id },
            data: {
              googleEventId: event.id,
              syncedAt: new Date(),
              syncStatus: 'SYNCED',
            },
          });
        } else {
          const event = await this.googleCalendarService.createEvent(userId, eventData);
          await this.prisma.calendarSyncRecord.upsert({
            where: {
              userId_entityType_entityId: {
                userId,
                entityType: 'CALL',
                entityId: callId,
              },
            },
            update: {
              googleEventId: event.id,
              syncedAt: new Date(),
              syncStatus: 'SYNCED',
            },
            create: {
              userId,
              entityType: 'CALL',
              entityId: callId,
              googleEventId: event.id,
              syncedAt: new Date(),
              syncStatus: 'SYNCED',
            },
          });
        }
      } catch (error: any) {
        this.logger.error(`Call ${callId} sync failed for user ${userId}: ${error.message}`, error.stack);
        await this.prisma.calendarSyncRecord.upsert({
          where: {
            userId_entityType_entityId: {
              userId,
              entityType: 'CALL',
              entityId: callId,
            },
          },
          update: {
            syncStatus: 'FAILED',
          },
          create: {
            userId,
            entityType: 'CALL',
            entityId: callId,
            syncStatus: 'FAILED',
          },
        });
      }
    }

    const existingRecords = await this.prisma.calendarSyncRecord.findMany({
      where: {
        entityType: 'CALL',
        entityId: callId,
      },
    });

    for (const record of existingRecords) {
      if (!targetUserIds.includes(record.userId)) {
        if (record.googleEventId) {
          try {
            await this.googleCalendarService.deleteEvent(record.userId, record.googleEventId);
          } catch (err: any) {
            this.logger.error(`Failed to delete call ${callId} event from user ${record.userId}: ${err.message}`);
          }
        }
        await this.prisma.calendarSyncRecord.delete({
          where: { id: record.id },
        });
      }
    }
  }

  private async syncAllUserEvents(userId: number) {
    this.logger.log(`Syncing all unsynced events for user ${userId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { accessLevel: true },
    });

    if (!user) return;

    // Get unsynced meetings
    let eligibleMeetingIds: number[] = [];
    if (user.accessLevel === 'ADMINISTRATIVE') {
      const meetings = await this.prisma.meeting.findMany({
        select: { id: true },
      });
      eligibleMeetingIds = meetings.map((m) => m.id);
    } else {
      const participants = await this.prisma.meetingParticipant.findMany({
        where: {
          participantType: 'USER',
          participantId: userId,
        },
        select: { meetingId: true },
      });
      // eligibleMeetingIds = participants.map((p) => p.meetingId);
      eligibleMeetingIds = participants.map((p) => p.meetingId).filter((id): id is number => id !== null);
    }

    const syncedMeetings = await this.prisma.calendarSyncRecord.findMany({
      where: {
        userId,
        entityType: 'MEETING',
        syncStatus: 'SYNCED',
      },
      select: { entityId: true },
    });
    const syncedMeetingIds = syncedMeetings.map((r) => r.entityId);

    const unsyncedMeetingIds = eligibleMeetingIds.filter((id) => !syncedMeetingIds.includes(id));
    for (const meetingId of unsyncedMeetingIds) {
      await this.syncMeeting(meetingId);
    }

    // Get unsynced tasks
    let eligibleTaskIds: number[] = [];
    if (user.accessLevel === 'ADMINISTRATIVE') {
      const tasks = await this.prisma.task.findMany({
        where: { dueDate: { not: null } },
        select: { id: true },
      });
      eligibleTaskIds = tasks.map((t) => t.id);
    } else {
      const tasks = await this.prisma.task.findMany({
        where: {
          ownerId: userId,
          dueDate: { not: null },
        },
        select: { id: true },
      });
      eligibleTaskIds = tasks.map((t) => t.id);
    }

    const syncedTasks = await this.prisma.calendarSyncRecord.findMany({
      where: {
        userId,
        entityType: 'TASK',
        syncStatus: 'SYNCED',
      },
      select: { entityId: true },
    });
    const syncedTaskIds = syncedTasks.map((r) => r.entityId);

    const unsyncedTaskIds = eligibleTaskIds.filter((id) => !syncedTaskIds.includes(id));
    for (const taskId of unsyncedTaskIds) {
      await this.syncTask(taskId);
    }

    // Get unsynced calls
    let eligibleCallIds: number[] = [];
    if (user.accessLevel === 'ADMINISTRATIVE') {
      const calls = await this.prisma.call.findMany({
        where: { callStartTime: { not: null } },
        select: { id: true },
      });
      eligibleCallIds = calls.map((c) => c.id);
    } else {
      const calls = await this.prisma.call.findMany({
        where: {
          ownerId: userId,
          callStartTime: { not: null },
        },
        select: { id: true },
      });
      eligibleCallIds = calls.map((c) => c.id);
    }

    const syncedCalls = await this.prisma.calendarSyncRecord.findMany({
      where: {
        userId,
        entityType: 'CALL',
        syncStatus: 'SYNCED',
      },
      select: { entityId: true },
    });
    const syncedCallIds = syncedCalls.map((r) => r.entityId);

    const unsyncedCallIds = eligibleCallIds.filter((id) => !syncedCallIds.includes(id));
    for (const callId of unsyncedCallIds) {
      await this.syncCall(callId);
    }
  }

  private async manualSyncAllUserEvents(userId: number) {
    this.logger.log(`Manual sync initiated for user ${userId}`);

    // 1. Find all user's sync records
    const syncRecords = await this.prisma.calendarSyncRecord.findMany({
      where: { userId },
    });

    // 2. Delete them from Google Calendar (ignore 404/410 errors)
    for (const record of syncRecords) {
      if (record.googleEventId) {
        try {
          await this.googleCalendarService.deleteEvent(userId, record.googleEventId);
        } catch (err: any) {
          this.logger.error(`Failed to delete event ${record.googleEventId}: ${err.message}`);
        }
      }
    }

    // 3. Delete records from database
    await this.prisma.calendarSyncRecord.deleteMany({
      where: { userId },
    });

    // 4. Trigger standard sync-all-user-events
    await this.syncAllUserEvents(userId);
  }

  private async syncAccessLevelChange(userId: number) {
    this.logger.log(`Syncing access level change for user ${userId}`);

    // Check if user has connected Google Calendar
    const account = await this.prisma.googleCalendar.findFirst({
      where: { connectedById: userId },
    });
    if (!account) return;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { accessLevel: true },
    });
    if (!user) return;

    if (user.accessLevel === 'ADMINISTRATIVE') {
      // ADMINISTRATIVE users get all events; trigger sync of unsynced events
      await this.syncAllUserEvents(userId);
    } else if (user.accessLevel === 'STANDARD') {
      // STANDARD users only keep events they own (tasks/calls) or participate in (meetings)
      const records = await this.prisma.calendarSyncRecord.findMany({
        where: { userId },
      });

      for (const record of records) {
        let keep = false;

        if (record.entityType === 'MEETING') {
          const isParticipant = await this.prisma.meetingParticipant.findFirst({
            where: {
              meetingId: record.entityId,
              participantType: 'USER',
              participantId: userId,
            },
          });
          keep = !!isParticipant;
        } else if (record.entityType === 'TASK') {
          const task = await this.prisma.task.findUnique({
            where: { id: record.entityId },
            select: { ownerId: true },
          });
          keep = task?.ownerId === userId;
        } else if (record.entityType === 'CALL') {
          const call = await this.prisma.call.findUnique({
            where: { id: record.entityId },
            select: { ownerId: true },
          });
          keep = call?.ownerId === userId;
        }

        if (!keep) {
          if (record.googleEventId) {
            try {
              await this.googleCalendarService.deleteEvent(userId, record.googleEventId);
            } catch (err: any) {
              this.logger.error(`Failed to delete event ${record.googleEventId} on accessLevel change: ${err.message}`);
            }
          }
          await this.prisma.calendarSyncRecord.delete({
            where: { id: record.id },
          });
        }
      }
    }
  }
}
