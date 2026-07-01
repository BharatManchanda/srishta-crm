import { Injectable } from '@nestjs/common';
import { PrismaFilter } from 'src/common/filters/prisma-filter.helper';
import { MeetingFilterDto } from './dto/meeting-filter.dto';

@Injectable()
export class MeetingFilterBuilder {
  build(dto: MeetingFilterDto) {
    return {
      id: PrismaFilter.equals(dto.id),
      entityType: PrismaFilter.equals(dto.entityType),
      entityId: PrismaFilter.equals(dto.entityId),
      title: PrismaFilter.contains(dto.title),
      location: PrismaFilter.contains(dto.location),
      status: dto.status,
      startTime: PrismaFilter.dateRange(dto.startTimeFrom, dto.startTimeTo),
      endTime: PrismaFilter.dateRange(dto.endTimeFrom, dto.endTimeTo),
      createdAt: PrismaFilter.dateRange(dto.createdFrom, dto.createdTo),
      updatedAt: PrismaFilter.dateRange(dto.updatedFrom, dto.updatedTo),
    };
  }
}
