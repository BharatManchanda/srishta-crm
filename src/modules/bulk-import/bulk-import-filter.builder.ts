import { Injectable } from '@nestjs/common';
import { PrismaFilter } from 'src/common/filters/prisma-filter.helper';
import { ImportJobFilterDto } from './dto/import-job-filter.dto';
import { ImportRowFilterDto } from './dto/import-row-filter.dto';

@Injectable()
export class BulkImportFilterBuilder {
  buildJob(dto: ImportJobFilterDto) {
    const where: any = {};

    if (dto.entity) {
      where.entity = dto.entity;
    }

    if (dto.status) {
      where.status = dto.status;
    }

    if (dto.search) {
      where.fileName = PrismaFilter.contains(dto.search);
    }

    return where;
  }

  buildRow(dto: ImportRowFilterDto) {
    const where: any = {};

    if (dto.importJobId) {
      where.importJobId = dto.importJobId;
    }

    if (dto.status) {
      where.status = dto.status;
    }

    if (dto.entity) {
      where.importJob = {
        entity: dto.entity,
      };
    }

    if (dto.search) {
      where.OR = [
        {
          error: PrismaFilter.contains(dto.search),
        },
        {
          data: {
            path: ['name'],
            string_contains: dto.search,
          },
        },
        {
          data: {
            path: ['Name'],
            string_contains: dto.search,
          },
        },
        {
          data: {
            path: ['email'],
            string_contains: dto.search,
          },
        },
        {
          data: {
            path: ['Email'],
            string_contains: dto.search,
          },
        },
        {
          data: {
            path: ['phone'],
            string_contains: dto.search,
          },
        },
        {
          data: {
            path: ['Phone'],
            string_contains: dto.search,
          },
        },
        {
          data: {
            path: ['accountName'],
            string_contains: dto.search,
          },
        },
        {
          data: {
            path: ['Account Name'],
            string_contains: dto.search,
          },
        },
      ];
    }

    return where;
  }
}
