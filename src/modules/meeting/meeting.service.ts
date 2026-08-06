import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MeetingFilterDto } from './dto/meeting-filter.dto';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { MeetingFilterBuilder } from './meeting-filter.builder';
import { MeetingCreateDto } from './dto/meeting-create.dto';
import { MeetingUpdateDto } from './dto/meeting-update.dto';
import { UpdateViewSettingDto } from './dto/update-view-setting.dto';
import { ActivityEntity, AiEntityType, WhatsappEntityType } from '@prisma/client';
import { ActivityService } from '../activity/activity.service';
import { UserPolicy } from '../user/user.policy';
import { AiService } from '../ai/ai.service';
import { meetingToDocument } from 'src/common/helpers/build-document';
import { EmailService } from '../email/email.service';
import { NotificationService } from '../notification/notification.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class MeetingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly meetingFilterBuilder: MeetingFilterBuilder,
    private readonly activityService: ActivityService,
    private readonly userPolicy: UserPolicy,
    private readonly aiService: AiService,
    private readonly emailService: EmailService,
    private readonly notificationService: NotificationService,
    private readonly whatsappService: WhatsappService,
    @InjectQueue('google-calendar-sync') private readonly calendarSyncQueue: Queue,
  ) {}

  async getList(dto: MeetingFilterDto, currentUserId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      select: { accessLevel: true },
    });

    const where: any = {
      ...this.meetingFilterBuilder.build(dto),
      id: {
        in: dto.id !== undefined && dto.id ? [dto.id] : undefined,
      },
    };

    if (user?.accessLevel === 'STANDARD') {
      where.participants = {
        some: {
          participantType: 'USER',
          participantId: currentUserId,
        },
      };
    } else {
      where.createdById = {
        in: await this.userPolicy.getAccessibleUserIds(currentUserId),
      };
    }

    const orderBy = dto.sortBy ? { [dto.sortBy]: dto.sortOrder || 'desc' } : { id: 'desc' };

    const result = await this.paginationService.paginate(this.prisma.meeting, {
      page: dto.page,
      perPage: dto.perPage,
      where,
      include: {
        createdBy: true,
        participants: true,
      },
      orderBy,
    });
    return result;
  }

  async get(id: number) {
    const meeting = await this.prisma.meeting.findFirst({
      where: {
        id,
      },
      include: {
        createdBy: true,
        participants: true,
      },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    const [notes, attachments] = await Promise.all([
      this.prisma.note.count({ where: { entityType: 'MEETING', entityId: id } }),
      this.prisma.attachment.count({ where: { entityType: 'MEETING', entityId: id } }),
    ]);

    return {
      ...meeting,
      counts: {
        notes,
        attachments,
      },
    };
  }

  async create(dto: MeetingCreateDto, authUserId: number) {
    const { participants, ...meetingData } = dto;

    const meeting = await this.prisma.meeting.create({
      data: {
        ...meetingData,
        createdById: authUserId,
        participants: participants && participants.length > 0 ? {
          create: participants,
        } : undefined,
      },
      include: {
        participants: true,
      },
    });

    // Notify participants
    if (participants && participants.length > 0) {
      const userIdsToNotify = participants
        .filter((p) => p.participantType === 'USER' && p.participantId)
        .map((p) => p.participantId as number);

      if (userIdsToNotify.length > 0) {
        await this.notificationService.create({
          title: 'Meeting Scheduled',
          message: `You have been scheduled for meeting: "${meeting.title}" on ${new Date(meeting.startTime).toLocaleString()}.`,
          type: 'MEETING',
          module: 'MEETING',
          entityId: meeting.id,
          createdBy: authUserId,
          userIds: userIdsToNotify,
        });

        await this.sendWhatsappReminder(meeting.id, authUserId, `Meeting Scheduled
          Title: ${meeting.title}
          Start: ${new Date(meeting.startTime).toLocaleString()}
          End: ${new Date(meeting.endTime).toLocaleString()}

          Please be on time.`
        );
      }
    }

    // 1. Log under Meeting itself
    await this.activityService.create({
      entityType: ActivityEntity.MEETING,
      entityId: meeting.id,
      action: 'MEETINGS_ADDED',
      description: `Meeting "${meeting.title}" scheduled.`,
      metadata: {
        title: meeting.title,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
      },
    }, authUserId);

    // 2. Log under parent entity if exists
    if (meeting.entityType && meeting.entityId) {
      await this.activityService.create({
        entityType: meeting.entityType as any,
        entityId: meeting.entityId,
        action: 'MEETINGS_ADDED',
        description: `Meeting scheduled: "${meeting.title}"`,
        metadata: {
          title: meeting.title,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
        },
      }, authUserId);
    }

    await this.calendarSyncQueue.add('sync-meeting', { meetingId: meeting.id });

    await this.aiService.create({
      entityType: AiEntityType.MEETING,
      entityId: meeting.id,
      title: meeting.title ?? "",
      content: meetingToDocument(meeting),
    }, authUserId);

    return meeting;
  }

  async update(dto: MeetingUpdateDto, id: number, authUserId: number) {
    const { participants, ...meetingData } = dto;

    const existingMeeting = await this.prisma.meeting.findUnique({
      where: { id },
    });

    if (!existingMeeting) {
      throw new NotFoundException('Meeting not found');
    }

    const oldParticipants = await this.prisma.meetingParticipant.findMany({
      where: { meetingId: id },
    });

    const updatedMeeting = await this.prisma.$transaction(async (tx) => {
      if (participants !== undefined) {
        // Delete existing participants
        await tx.meetingParticipant.deleteMany({
          where: { meetingId: id },
        });

        // Re-create participants if any are provided
        if (participants.length > 0) {
          await tx.meetingParticipant.createMany({
            data: participants.map((p) => ({
              ...p,
              meetingId: id,
            })),
          });
        }
      }

      return await tx.meeting.update({
        where: { id },
        data: meetingData,
        include: {
          participants: true,
        },
      });
    });

    if (participants !== undefined) {
      const oldParticipantKeys = new Set(
        oldParticipants.map((p) => `${p.participantType}_${p.participantId}`)
      );
      
      const newParticipants = participants.filter(
        (p) => !oldParticipantKeys.has(`${p.participantType}_${p.participantId}`)
      );

      const userIdsToNotify = newParticipants
        .filter((p) => p.participantType === 'USER' && p.participantId)
        .map((p) => p.participantId as number);

      if (userIdsToNotify.length > 0) {
        await this.notificationService.create({
          title: 'Meeting Scheduled',
          message: `You have been added to meeting: "${updatedMeeting.title}" scheduled for ${new Date(updatedMeeting.startTime).toLocaleString()}.`,
          type: 'MEETING',
          module: 'MEETING',
          entityId: updatedMeeting.id,
          createdBy: authUserId,
          userIds: userIdsToNotify,
        });

        await this.sendWhatsappReminder(updatedMeeting.id, authUserId, `Meeting Rescheduled
          Title: ${updatedMeeting.title}
          Start: ${new Date(updatedMeeting.startTime).toLocaleString()}
          End: ${new Date(updatedMeeting.endTime).toLocaleString()}

          Please be on time.`
        );
      }
    }

    // 1. Log under Meeting itself
    await this.activityService.create({
      entityType: ActivityEntity.MEETING,
      entityId: updatedMeeting.id,
      action: 'MEETINGS_EDIT',
      description: `Meeting "${updatedMeeting.title}" updated.`,
      metadata: {
        before: existingMeeting,
        after: updatedMeeting,
      },
    }, authUserId);

    // 2. Log under parent entity if exists
    if (updatedMeeting.entityType && updatedMeeting.entityId) {
      await this.activityService.create({
        entityType: updatedMeeting.entityType as any,
        entityId: updatedMeeting.entityId,
        action: 'MEETINGS_EDIT',
        description: `Meeting updated: "${updatedMeeting.title}" (Status: ${updatedMeeting.status})`,
        metadata: {
          before: existingMeeting,
          after: updatedMeeting,
        },
      }, authUserId);
    }

    await this.calendarSyncQueue.add('sync-meeting', { meetingId: updatedMeeting.id });

    await this.aiService.update({
      entityType: AiEntityType.MEETING,
      entityId: updatedMeeting.id,
      title: updatedMeeting.title ?? "",
      content: meetingToDocument(updatedMeeting),
    }, authUserId);

    return updatedMeeting;
  }

  async delete(id: number, authUserId: number) {
    const existingMeeting = await this.prisma.meeting.findUnique({
      where: { id },
    });

    if (!existingMeeting) {
      throw new NotFoundException('Meeting not found');
    }

    const syncRecords = await this.prisma.calendarSyncRecord.findMany({
      where: {
        entityType: 'MEETING',
        entityId: id,
      },
    });

    for (const record of syncRecords) {
      if (record.googleEventId) {
        await this.calendarSyncQueue.add('delete-calendar-event', {
          userId: record.userId,
          googleEventId: record.googleEventId,
        });
      }
    }

    await this.prisma.calendarSyncRecord.deleteMany({
      where: {
        entityType: 'MEETING',
        entityId: id,
      },
    });

    // MeetingParticipant will be auto-deleted because of onDelete: Cascade in Prisma schema
    const meeting = await this.prisma.meeting.delete({
      where: {
        id,
      },
    });

    // 1. Log under Meeting itself
    await this.activityService.create({
      entityType: ActivityEntity.MEETING,
      entityId: meeting.id,
      action: 'MEETINGS_DELETED',
      description: `Meeting "${meeting.title}" deleted.`,
      metadata: {
        title: meeting.title,
      },
    }, authUserId);

    // 2. Log under parent entity if exists
    if (existingMeeting.entityType && existingMeeting.entityId) {
      await this.activityService.create({
        entityType: existingMeeting.entityType as any,
        entityId: existingMeeting.entityId,
        action: 'MEETINGS_DELETED',
        description: `Meeting deleted: "${meeting.title}"`,
        metadata: {
          title: meeting.title,
        },
      }, authUserId);
    }

    return meeting;
  }

  async createDefaultMeetingView(userId: number) {
    const meetingModule = await this.prisma.module.findUnique({
      where: {
        path: '/meetings',
      },
    });
    if (!meetingModule) return;
    await this.prisma.userTableView.create({
      data: {
        userId: userId,
        moduleId: meetingModule.id,
        name: 'Default',
        isDefault: true,
        columns: {
          create: [
            { field: 'id', label: 'ID', visible: true, order: 1 },
            { field: 'title', label: 'Title', visible: true, order: 2 },
            { field: 'startTime', label: 'Start Time', visible: true, order: 3 },
            { field: 'endTime', label: 'End Time', visible: true, order: 4 },
            { field: 'location', label: 'Location', visible: true, order: 5 },
            { field: 'url', label: 'Meeting URL', visible: true, order: 6 },
            { field: 'status', label: 'Status', visible: true, order: 7 },
            { field: 'entityType', label: 'Related To Type', visible: true, order: 8 },
            { field: 'entityId', label: 'Related To ID', visible: true, order: 9 },
            { field: 'description', label: 'Description', visible: false, order: 10 },
            { field: 'createdById', label: 'Created By ID', visible: false, order: 11 },
            { field: 'createdAt', label: 'Created At', visible: false, order: 12 },
            { field: 'updatedAt', label: 'Updated At', visible: false, order: 13 },
            { field: 'action', label: 'Action', visible: true, order: 14 },
          ],
        },
      },
    });
  }

  async viewSetting(authUserId: number) {
    const meetingModule = await this.prisma.module.findFirst({
      where: {
        path: '/meetings',
      },
    });
    if (!meetingModule) return;
    const viewSetting = await this.prisma.userTableView.findFirst({
      where: {
        userId: authUserId,
        isDefault: true,
        moduleId: meetingModule.id,
      },
      include: {
        columns: true,
      },
    });

    if (!viewSetting) {
      await this.createDefaultMeetingView(authUserId);
      return this.prisma.userTableView.findFirst({
        where: {
          userId: authUserId,
          isDefault: true,
          moduleId: meetingModule.id,
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
    const deletedMeetings: any[] = [];
    for (const id of ids) {
      const deleted = await this.delete(id, authUserId);
      deletedMeetings.push(deleted);
    }
    return deletedMeetings;
  }

  async bulkUpdate(ids: number[], data: any, authUserId: number) {
    const whitelistedKeys = [
      'status',
      'description',
      'location',
      'url',
    ];

    const cleanData = {};
    for (const key of Object.keys(data)) {
      if (whitelistedKeys.includes(key)) {
        cleanData[key] = data[key];
      }
    }

    const updatedMeetings: any[] = [];
    for (const id of ids) {
      const updated = await this.update(cleanData as any, id, authUserId);
      updatedMeetings.push(updated);
    }
    return updatedMeetings;
  }

  async sendReminder(id: number, authUserId: number) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
      include: {
        participants: true,
      },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    const errors: string[] = [];
    let sentCount = 0;

    for (const participant of meeting.participants) {
      let email = participant.email;
      let name = participant.name || '';

      if (participant.participantId) {
        if (participant.participantType === 'USER') {
          const user = await this.prisma.user.findUnique({
            where: { id: participant.participantId },
            select: { email: true, name: true },
          });
          if (user) {
            email = user.email;
            name = user.name || '';
          }
        } else if (participant.participantType === 'LEAD') {
          const lead = await this.prisma.lead.findUnique({
            where: { id: participant.participantId },
            select: { email: true, name: true },
          });
          if (lead) {
            email = lead.email;
            name = lead.name || '';
          }
        } else if (participant.participantType === 'CONTACT') {
          const contact = await this.prisma.contact.findUnique({
            where: { id: participant.participantId },
            select: { email: true, name: true },
          });
          if (contact) {
            email = contact.email;
            name = contact.name || '';
          }
        }
      }

      if (!email) {
        continue;
      }

      try {
        const subject = `Meeting Reminder: ${meeting.title}`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #4f46e5; margin-bottom: 20px;">Meeting Reminder</h2>
            <p>Hello <strong>${name || 'Participant'}</strong>,</p>
            <p>This is a reminder for your upcoming meeting scheduled in Srishta CRM.</p>
            
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #e5e7eb;">
              <h3 style="margin-top: 0; color: #111827;">${meeting.title}</h3>
              <p style="margin: 5px 0;"><strong>Start Time:</strong> ${meeting.startTime.toLocaleString()}</p>
              <p style="margin: 5px 0;"><strong>End Time:</strong> ${meeting.endTime.toLocaleString()}</p>
              ${meeting.location ? `<p style="margin: 5px 0;"><strong>Location:</strong> ${meeting.location}</p>` : ''}
              ${meeting.url ? `<p style="margin: 5px 0;"><strong>Join Link:</strong> <a href="${meeting.url}" style="color: #4f46e5; text-decoration: none;">Join Meeting</a></p>` : ''}
            </div>
            
            ${meeting.description ? `<p style="color: #4b5563; font-style: italic; margin-top: 20px;">"${meeting.description}"</p>` : ''}
            
            <p style="margin-top: 30px; font-size: 12px; color: #9ca3af;">This is an automated notification from Srishta CRM.</p>
          </div>
        `;

        await this.emailService.sendEmail(email, subject, html);
        sentCount++;

        // Store email history in DB
        const mappedEntityType = participant.participantType === 'LEAD' ? 'LEAD' : 'CONTACT';
        await this.prisma.email.create({
          data: {
            entityType: mappedEntityType,
            entityId: participant.participantId || id,
            recipientEmail: email,
            subject,
            content: html,
            createdById: authUserId,
            status: 'DELIVERED',
          },
        });

      } catch (err: any) {
        console.error(`Failed to send reminder email to ${email}:`, err);
        errors.push(`Participant ${name} (${email}): ${err.message || 'Send failed'}`);

        try {
          const subject = `Meeting Reminder: ${meeting.title}`;
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <h2 style="color: #4f46e5; margin-bottom: 20px;">Meeting Reminder</h2>
              <p>Hello <strong>${name || 'Participant'}</strong>,</p>
              <p>This is a reminder for your upcoming meeting scheduled in Srishta CRM.</p>
              
              <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <h3 style="margin-top: 0; color: #111827;">${meeting.title}</h3>
                <p style="margin: 5px 0;"><strong>Start Time:</strong> ${meeting.startTime.toLocaleString()}</p>
                <p style="margin: 5px 0;"><strong>End Time:</strong> ${meeting.endTime.toLocaleString()}</p>
                ${meeting.location ? `<p style="margin: 5px 0;"><strong>Location:</strong> ${meeting.location}</p>` : ''}
                ${meeting.url ? `<p style="margin: 5px 0;"><strong>Join Link:</strong> <a href="${meeting.url}" style="color: #4f46e5; text-decoration: none;">Join Meeting</a></p>` : ''}
              </div>
              
              ${meeting.description ? `<p style="color: #4b5563; font-style: italic; margin-top: 20px;">"${meeting.description}"</p>` : ''}
              
              <p style="margin-top: 30px; font-size: 12px; color: #9ca3af;">This is an automated notification from Srishta CRM.</p>
            </div>
          `;
          const mappedEntityType = participant.participantType === 'LEAD' ? 'LEAD' : 'CONTACT';
          await this.prisma.email.create({
            data: {
              entityType: mappedEntityType,
              entityId: participant.participantId || id,
              recipientEmail: email,
              subject,
              content: html,
              createdById: authUserId,
              status: 'FAILED',
            },
          });
        } catch (dbErr) {
          console.error(`Failed to store failed email history in DB:`, dbErr);
        }
      }
    }

    // Log activity under Meeting
    await this.activityService.create({
      entityType: ActivityEntity.MEETING,
      entityId: meeting.id,
      action: 'REMINDER_SENT',
      description: `Sent meeting reminder to ${sentCount} participant(s).`,
      metadata: {
        sentCount,
        errors: errors.length > 0 ? errors : undefined,
      },
    }, authUserId);

    return {
      success: true,
      sentCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private async sendWhatsappReminder(meetingId: number, authUserId: number, message: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        participants: true,
      },
    });

    if (!meeting) return;

    for (const participant of meeting.participants) {
      let phone: string | null = null;

      if (participant.participantId) {
        switch (participant.participantType) {
          case 'USER': {
            const user = await this.prisma.user.findUnique({
              where: { id: participant.participantId },
              select: { phone: true },
            });
            phone = user?.phone ?? null;
            break;
          }

          case 'LEAD': {
            const lead = await this.prisma.lead.findUnique({
              where: { id: participant.participantId },
              select: { phone: true },
            });
            phone = lead?.phone ?? null;
            break;
          }

          case 'CONTACT': {
            const contact = await this.prisma.contact.findUnique({
              where: { id: participant.participantId },
              select: { phone: true },
            });
            phone = contact?.phone ?? null;
            break;
          }
        }
      }

      if (!phone) continue;

      try {
        await this.whatsappService.sendMessage(
          {
            message,
            entityType: WhatsappEntityType.MEETING,
            entityId: meeting.id,
            to: phone,
          },
          authUserId,
        );
      } catch (err) {
        console.error(
          `Failed to send WhatsApp to ${phone}`,
          err,
        );
      }
    }
  }
}
