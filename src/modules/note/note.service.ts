import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NoteFilterDto } from './dto/note-filter.dto';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { NoteFilterBuilder } from './note-filter.builder';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { NoteCreateDto } from './dto/note-create.dto';
import { NoteUpdateDto } from './dto/note-update.dto';
import { BulkNoteCreateDto } from './dto/bulk-note-create.dto';
import { ActivityService } from '../activity/activity.service';
import { NotificationService } from '../notification/notification.service';


@Injectable()
export class NoteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly noteFilterBuilder: NoteFilterBuilder,
    private readonly userHierarchyService: UserHierarchyService,
    private readonly activityService: ActivityService,
    private readonly notificationService: NotificationService,
  ) {}

  async getList(dto: NoteFilterDto, currentUserId: number) {
    const orderBy = dto.sortBy ? { [dto.sortBy]: dto.sortOrder || 'desc' } : { id: 'desc' };

    const result = await this.paginationService.paginate(this.prisma.note, {
      page: dto.page,
      perPage: dto.perPage,
      where: {
        ...this.noteFilterBuilder.build(dto),
        createdById: {
          in: await this.userHierarchyService.getFamilyUserIds(currentUserId),
        },
        id: {
          in: dto.id !== undefined && dto.id ? [dto.id] : undefined,
        },
      },
      include: {
        createdBy: true,
      },
      orderBy,
    });
    return result;
  }

  async get(id: number) {
    const note = await this.prisma.note.findFirst({
      where: {
        id,
      },
      include: {
        createdBy: true,
      },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    return note;
  }

  async create(dto: NoteCreateDto, authUserId: number) {
    const newNote = await this.prisma.note.create({
      data: {
        ...dto,
        createdById: authUserId,
      },
    });

    await this.activityService.create({
      entityType: dto.entityType as any,
      entityId: dto.entityId,
      action: 'NOTE_ADDED',
      description: `Note created: "${dto.title}"`,
    }, authUserId);

    // Process mentions
    try {
      const users = await this.prisma.user.findMany({
        where: { status: 'ACTIVE' },
      });

      const textToSearch = `${dto.title || ''} ${dto.content || ''}`;
      const mentionedUsers = users.filter((user) => {
        const escapedName = user.name?.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') || '';
        const escapedEmail = user.email.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        
        const nameRegex = new RegExp(`@${escapedName}\\b`, 'i');
        const emailRegex = new RegExp(`@${escapedEmail}\\b`, 'i');

        return (user.name && nameRegex.test(textToSearch)) || emailRegex.test(textToSearch);
      });

      for (const u of mentionedUsers) {
        if (u.id === authUserId) continue;

        await this.notificationService.create({
          title: 'New Mention',
          message: `You were mentioned in a note: "${dto.title}"`,
          type: 'SYSTEM',
          module: dto.entityType === 'LEAD' ? 'LEAD' : dto.entityType === 'CONTACT' ? 'CONTACT' : undefined,
          entityId: dto.entityId,
          createdBy: authUserId,
          userIds: [u.id],
        });
      }
    } catch (err) {
      console.error('Failed to process mentions in note creation:', err);
    }

    return newNote;
  }

  async update(dto: NoteUpdateDto, id: number, authUserId: number) {
    const oldNote = await this.prisma.note.findUnique({
      where: { id },
    });

    if (!oldNote) {
      throw new NotFoundException('Note not found');
    }

    const updatedNote = await this.prisma.note.update({
      where: { id },
      data: dto,
    });

    await this.activityService.create(
      {
        entityType: oldNote.entityType as any,
        entityId: oldNote.entityId,
        action: 'NOTE_EDIT',
        description: `Note "${updatedNote.title}" updated.`,
        metadata: {
          before: oldNote,
          after: updatedNote,
        },
      },
      authUserId,
    );

    return updatedNote;
  }

  async delete(id: number, authUserId: number) {
    const existingNote = await this.prisma.note.findUnique({
      where: { id },
    });

    if (!existingNote) {
      throw new NotFoundException('Note not found');
    }

    const deletedNote = await this.prisma.note.delete({
      where: {
        id,
      },
    });

    await this.activityService.create({
      entityType: existingNote.entityType as any,
      entityId: existingNote.entityId,
      action: 'NOTE_DELETED',
      description: `Note deleted: "${deletedNote.title}"`,
    }, authUserId);

    return deletedNote;
  }

  async bulkCreate(dto: BulkNoteCreateDto, authUserId: number) {
    const notes: any[] = [];
    const { entityIds, ...noteData } = dto;
    for (const entityId of entityIds) {
      const note = await this.create({
        ...noteData,
        entityId,
      } as any, authUserId);
      notes.push(note);
    }
    return notes;
  }
}

