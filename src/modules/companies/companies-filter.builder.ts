import { Injectable } from '@nestjs/common';
import { PrismaFilter } from 'src/common/filters/prisma-filter.helper';
import { CompaniesFilterDto } from './dto/companies-filter.dto';

@Injectable()
export class CompaniesFilterBuilder {
    constructor() { }

  build(dto: CompaniesFilterDto) {

    return {

      companyCity: PrismaFilter.contains(dto.companyCity),
      companyCountry: PrismaFilter.contains(dto.companyCountry),
      companyName: PrismaFilter.contains(dto.companyName),
      companyPhone: PrismaFilter.contains(dto.companyPhone),
      employees: PrismaFilter.equals(dto.employees),

      companyEmail: PrismaFilter.contains(dto.companyEmail),
      name: PrismaFilter.contains(dto.name),
    };
  }
}
