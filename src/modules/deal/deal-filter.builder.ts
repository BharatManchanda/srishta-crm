import { Injectable } from '@nestjs/common';
import { PrismaFilter } from 'src/common/filters/prisma-filter.helper';
import { DealFilterDto } from './dto/deal-filter.dto';

@Injectable()
export class DealFilterBuilder {
  constructor() {}

  private dateDay(value?: string) {
    if (!value) return undefined;

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return undefined;
    }

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return {
      gte: start,
      lte: end,
    };
  }

  build(dto: DealFilterDto) {
    const where: any = {
      name: PrismaFilter.contains(dto.name),
      socialLeadId: PrismaFilter.contains(dto.socialLeadId),
      description: PrismaFilter.contains(dto.description),
      nextStep: PrismaFilter.contains(dto.nextStep),

      amount: PrismaFilter.range(dto.minAmount, dto.maxAmount),
      probability: PrismaFilter.range(
        dto.minProbability,
        dto.maxProbability,
      ),

      leadSource: PrismaFilter.equals(dto.leadSource),
      stage: PrismaFilter.equals(dto.stage),
      type: PrismaFilter.equals(dto.type),

      ownerId: PrismaFilter.equals(dto.ownerId),
      accountId: PrismaFilter.equals(dto.accountId),
      contactId: PrismaFilter.equals(dto.contactId),

      closingDate: this.dateDay(dto.closingDate),
      createdAt: this.dateDay(dto.createdAt),
      updatedAt: this.dateDay(dto.updatedAt),
    };

    if (dto.createdById !== undefined && dto.createdById !== null) {
      const parsedId = Number(dto.createdById);

      if (!isNaN(parsedId)) {
        where.createdById = parsedId;
      }
    }

    return where;
  }
}