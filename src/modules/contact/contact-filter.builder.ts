import { Injectable } from '@nestjs/common';
import { PrismaFilter } from 'src/common/filters/prisma-filter.helper';
import { ContactFilterDto } from './dto/contact-filter.dto';

@Injectable()
export class ContactFilterBuilder {
  build(dto: ContactFilterDto) {
    const mailingAddress = {
      country: PrismaFilter.contains(dto['mailingAddress.country']),
      flatHouseNo: PrismaFilter.contains(dto['mailingAddress.flatHouseNo']),
      streetAddress: PrismaFilter.contains(dto['mailingAddress.streetAddress']),
      city: PrismaFilter.contains(dto['mailingAddress.city']),
      stateProvince: PrismaFilter.contains(dto['mailingAddress.stateProvince']),
      postalCode: PrismaFilter.contains(dto['mailingAddress.postalCode']),
    };

    const otherAddress = {
      country: PrismaFilter.contains(dto['otherAddress.country']),
      flatHouseNo: PrismaFilter.contains(dto['otherAddress.flatHouseNo']),
      streetAddress: PrismaFilter.contains(dto['otherAddress.streetAddress']),
      city: PrismaFilter.contains(dto['otherAddress.city']),
      stateProvince: PrismaFilter.contains(dto['otherAddress.stateProvince']),
      postalCode: PrismaFilter.contains(dto['otherAddress.postalCode']),
    };

    const where: any = {
      id: PrismaFilter.equals(dto.id),
      name: PrismaFilter.contains(dto.name),
      title: PrismaFilter.contains(dto.title),
      email: PrismaFilter.contains(dto.email),
      phone: PrismaFilter.contains(dto.phone),
      source: PrismaFilter.equals(dto.source),
      fax: PrismaFilter.contains(dto.fax),
      assistant: PrismaFilter.contains(dto.assistant),
      assistantPhone: PrismaFilter.contains(dto.assistantPhone),
      department: PrismaFilter.contains(dto.department),
      skypeId: PrismaFilter.contains(dto.skypeId),
      twitter: PrismaFilter.contains(dto.twitter),
      description: PrismaFilter.contains(dto.description),
      dateOfBirth: PrismaFilter.dateRange(
        dto.dateOfBirthFrom,
        dto.dateOfBirthTo,
      ),
      createdAt: PrismaFilter.dateRange(dto.createdFrom, dto.createdTo),
      updatedAt: PrismaFilter.dateRange(dto.updatedFrom, dto.updatedTo),
      mailingAddress: Object.values(mailingAddress).some(Boolean)
        ? mailingAddress
        : undefined,
      otherAddress: Object.values(otherAddress).some(Boolean)
        ? otherAddress
        : undefined,
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
