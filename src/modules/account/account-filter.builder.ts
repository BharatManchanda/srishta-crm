import { Injectable } from '@nestjs/common';
import { PrismaFilter } from 'src/common/filters/prisma-filter.helper';
import { AccountFilterDto } from './dto/account-filter.dto';

@Injectable()
export class AccountFilterBuilder {
  build(dto: AccountFilterDto) {
    const billingAddress = {
      country: PrismaFilter.contains(dto['billingAddress.country']),
      city: PrismaFilter.contains(dto['billingAddress.city']),
      stateProvince: PrismaFilter.contains(dto['billingAddress.stateProvince']),
      streetAddress: PrismaFilter.contains(dto['billingAddress.streetAddress']),
      postalCode: PrismaFilter.contains(dto['billingAddress.postalCode']),
    };

    const shippingAddress = {
      country: PrismaFilter.contains(dto['shippingAddress.country']),
      city: PrismaFilter.contains(dto['shippingAddress.city']),
      stateProvince: PrismaFilter.contains(
        dto['shippingAddress.stateProvince'],
      ),
      streetAddress: PrismaFilter.contains(
        dto['shippingAddress.streetAddress'],
      ),
      postalCode: PrismaFilter.contains(dto['shippingAddress.postalCode']),
    };

    const where: any = {
      id: PrismaFilter.equals(dto.id),
      accountName: PrismaFilter.contains(dto.accountName),
      accountSite: PrismaFilter.contains(dto.accountSite),
      parentAccountId: PrismaFilter.equals(dto.parentAccountId),
      accountNumber: PrismaFilter.contains(dto.accountNumber),
      accountType: PrismaFilter.equals(dto.accountType),
      industry: PrismaFilter.contains(dto.industry),
      annualRevenue: PrismaFilter.range(
        dto.annualRevenueFrom,
        dto.annualRevenueTo,
      ),
      rating: PrismaFilter.equals(dto.rating),
      phone: PrismaFilter.contains(dto.phone),
      fax: PrismaFilter.contains(dto.fax),
      website: PrismaFilter.contains(dto.website),
      tickerSymbol: PrismaFilter.contains(dto.tickerSymbol),
      ownership: PrismaFilter.equals(dto.ownership),
      employees: PrismaFilter.range(dto.employeesFrom, dto.employeesTo),
      sicCode: PrismaFilter.contains(dto.sicCode),
      description: PrismaFilter.contains(dto.description),
      createdAt: PrismaFilter.dateRange(dto.createdFrom, dto.createdTo),
      updatedAt: PrismaFilter.dateRange(dto.updatedFrom, dto.updatedTo),
      billingAddress: Object.values(billingAddress).some(Boolean)
        ? billingAddress
        : undefined,
      shippingAddress: Object.values(shippingAddress).some(Boolean)
        ? shippingAddress
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
