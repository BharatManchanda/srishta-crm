import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NoteFilterDto } from './dto/note-filter.dto';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { NoteFilterBuilder } from './note-filter.builder';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { NoteCreateDto } from './dto/note-create.dto';
import { NoteUpdateDto } from './dto/note-update.dto';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class NoteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly noteFilterBuilder: NoteFilterBuilder,
    private readonly userHierarchyService: UserHierarchyService,
    private readonly activityService: ActivityService,
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
}
