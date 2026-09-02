import { Injectable } from '@nestjs/common';
import { PrismaFilter } from 'src/common/filters/prisma-filter.helper';
import { ContactInquiryFilterDto } from './dto/contact-inquiry-filter.dto';

@Injectable()
export class ContactInquiryFilterBuilder {
  build(dto: ContactInquiryFilterDto) {
    const where: any = {
      id: PrismaFilter.equals(dto.id),
      name: PrismaFilter.contains(dto.name),
      email: PrismaFilter.contains(dto.email),
      phone: PrismaFilter.contains(dto.phone),
      company: PrismaFilter.contains(dto.company),
      website: PrismaFilter.contains(dto.website),
      source: PrismaFilter.contains(dto.source),
      inquiryType: PrismaFilter.equals(dto.inquiryType),
      status: PrismaFilter.equals(dto.status),
      priority: PrismaFilter.equals(dto.priority),
      // createdAt: PrismaFilter.dateRange(dto.createdFrom, dto.createdTo),
      // updatedAt: PrismaFilter.dateRange(dto.updatedFrom, dto.updatedTo),
    }
    return where;
  }
}
