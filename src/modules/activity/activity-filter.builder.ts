import { Injectable } from '@nestjs/common';
import { PrismaFilter } from 'src/common/filters/prisma-filter.helper';
import { ActivityFilterDto } from './dto/activity-filter.dto';
// import { AccountFilterDto } from './dto/account-filter.dto';

@Injectable()
export class ActivityFilterBuilder {
  build(dto: ActivityFilterDto) {
    return {
      ...(dto.id !== undefined && { id: dto.id }),
      ...(dto.entityId !== undefined && { entityId: dto.entityId }),
      ...(dto.entityType && { entityType: dto.entityType }),
      actions: PrismaFilter.contains(dto['actions']),
      description: PrismaFilter.contains(dto['description']),
    }
  }
}
