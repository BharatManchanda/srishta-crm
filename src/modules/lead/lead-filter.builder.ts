import { Injectable } from '@nestjs/common';
import { PrismaFilter } from 'src/common/filters/prisma-filter.helper';
import { LeadFilterDto } from './dto/lead-filter.dto';

@Injectable()
export class LeadFilterBuilder {
  constructor() {}

  private dateDay(value?: string) {
    if (!value) return undefined;
    const date = new Date(value);
    if (isNaN(date.getTime())) return undefined;
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return {
      gte: start,
      lte: end,
    };
  }

  build(dto: LeadFilterDto) {
    return {
      name: PrismaFilter.contains(dto.name),
      title: PrismaFilter.contains(dto.title),
      email: PrismaFilter.contains(dto.email),
      phone: PrismaFilter.contains(dto.phone),
      website: PrismaFilter.contains(dto.website),
      city: PrismaFilter.contains(dto.city),
      state: PrismaFilter.contains(dto.state),
      pinCode: PrismaFilter.contains(dto.pinCode),
      country: PrismaFilter.contains(dto.country),
      address: PrismaFilter.contains(dto.address),
      industry: PrismaFilter.contains(dto.industry),
      requirement: PrismaFilter.contains(dto.requirement),
      description: PrismaFilter.contains(dto.description),
      budget: PrismaFilter.equals(dto.budget),
      leadScore: PrismaFilter.equals(dto.leadScore),
      isQualified: PrismaFilter.equals(dto.isQualified),
      isConverted: PrismaFilter.equals(dto.isConverted),
      assignedToId: PrismaFilter.equals(dto.assignedToId),
      createdById: PrismaFilter.equals(dto.createdById),
      status: dto.status,
      priority: dto.priority,
      rating: dto.rating,
      source: dto.source,
      createdAt: this.dateDay(dto.createdAt),
      updatedAt: this.dateDay(dto.updatedAt),
      nextFollowUpDate: this.dateDay(dto.nextFollowUpDate),
      lastFollowUpDate: this.dateDay(dto.lastFollowUpDate),
    };
  }
}
