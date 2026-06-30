import { Injectable } from '@nestjs/common';
import { PrismaFilter } from 'src/common/filters/prisma-filter.helper';
import { AttachmentFilterDto } from './dto/attachment-filter.dto';

@Injectable()
export class AttachmentFilterBuilder {
  build(dto: AttachmentFilterDto) {
    return {
      id: PrismaFilter.equals(dto.id),
      entityType: PrismaFilter.equals(dto.entityType),
      entityId: PrismaFilter.equals(dto.entityId),
      type: PrismaFilter.equals(dto.type),
      title: PrismaFilter.contains(dto.title),
      createdAt: PrismaFilter.dateRange(dto.createdFrom, dto.createdTo),
      updatedAt: PrismaFilter.dateRange(dto.updatedFrom, dto.updatedTo),
    };
  }
}
