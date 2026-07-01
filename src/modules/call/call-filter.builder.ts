import { Injectable } from '@nestjs/common';
import { PrismaFilter } from 'src/common/filters/prisma-filter.helper';
import { CallFilterDto } from './dto/call-filter.dto';

@Injectable()
export class CallFilterBuilder {
  build(dto: CallFilterDto) {
    return {
      id: PrismaFilter.equals(dto.id),
      entityType: PrismaFilter.equals(dto.entityType),
      entityId: PrismaFilter.equals(dto.entityId),
      subject: PrismaFilter.contains(dto.subject),
      purpose: dto.purpose,
      status: dto.status,
      result: dto.result,
      callStartTime: PrismaFilter.dateRange(dto.callStartTimeFrom, dto.callStartTimeTo),
      createdAt: PrismaFilter.dateRange(dto.createdFrom, dto.createdTo),
      updatedAt: PrismaFilter.dateRange(dto.updatedFrom, dto.updatedTo),
    };
  }
}
