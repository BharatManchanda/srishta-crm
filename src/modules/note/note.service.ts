import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NoteFilterDto } from './dto/note-filter.dto';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { NoteFilterBuilder } from './note-filter.builder';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { NoteCreateDto } from './dto/note-create.dto';
import { NoteUpdateDto } from './dto/note-update.dto';

@Injectable()
export class NoteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly noteFilterBuilder: NoteFilterBuilder,
    private readonly userHierarchyService: UserHierarchyService,
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
    return await this.prisma.note.create({
      data: {
        ...dto,
        createdById: authUserId,
      },
    });
  }

  async update(dto: NoteUpdateDto, id: number) {
    const existingNote = await this.prisma.note.findUnique({
      where: { id },
    });

    if (!existingNote) {
      throw new NotFoundException('Note not found');
    }

    return await this.prisma.note.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: number) {
    const existingNote = await this.prisma.note.findUnique({
      where: { id },
    });

    if (!existingNote) {
      throw new NotFoundException('Note not found');
    }

    return await this.prisma.note.delete({
      where: {
        id,
      },
    });
  }
}
