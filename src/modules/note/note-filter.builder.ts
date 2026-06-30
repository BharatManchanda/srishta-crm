import { Injectable } from '@nestjs/common';
import { PrismaFilter } from 'src/common/filters/prisma-filter.helper';
import { NoteFilterDto } from './dto/note-filter.dto';

@Injectable()
export class NoteFilterBuilder {
  build(dto: NoteFilterDto) {
    return {
      id: PrismaFilter.equals(dto.id),
      entityType: PrismaFilter.equals(dto.entityType),
      entityId: PrismaFilter.equals(dto.entityId),
      isPinned: PrismaFilter.equals(dto.isPinned),
      title: PrismaFilter.contains(dto.title),
      content: PrismaFilter.contains(dto.content),
      createdAt: PrismaFilter.dateRange(dto.createdFrom, dto.createdTo),
      updatedAt: PrismaFilter.dateRange(dto.updatedFrom, dto.updatedTo),
    };
  }
}
