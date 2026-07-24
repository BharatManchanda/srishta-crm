import { Injectable } from '@nestjs/common';
import { PrismaFilter } from 'src/common/filters/prisma-filter.helper';
import { AttachmentFilterDto } from './dto/attachment-filter.dto';

@Injectable()
export class AttachmentFilterBuilder {
  build(dto: AttachmentFilterDto) {
    const where: any = {
      id: PrismaFilter.equals(dto.id),
      entityType: PrismaFilter.equals(dto.entityType),
      entityId: PrismaFilter.equals(dto.entityId),
      type: PrismaFilter.equals(dto.type),
      title: PrismaFilter.contains(dto.title),
      createdAt: PrismaFilter.dateRange(dto.createdFrom, dto.createdTo),
      updatedAt: PrismaFilter.dateRange(dto.updatedFrom, dto.updatedTo),
    };

    if (dto.createdById) {
      const parsedId = Number(dto.createdById);
      if (!isNaN(parsedId)) {
        where.createdById = parsedId;
      } else {
        where.createdBy = {
          name: {
            contains: dto.createdById,
            mode: 'insensitive',
          },
        };
      }
    }

    return where;
  }
}
