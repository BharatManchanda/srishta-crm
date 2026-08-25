import { Injectable } from '@nestjs/common';
import { PrismaFilter } from 'src/common/filters/prisma-filter.helper';
import { PricingPlanFilterDto } from './dto/pricing-filter.dto';

@Injectable()
export class PricingFilterBuilder {
  constructor() {}

  build(dto: PricingPlanFilterDto) {
    const where: any = {
      name: PrismaFilter.contains(dto.name),
      slug: PrismaFilter.contains(dto.slug),
      currency: PrismaFilter.equals(dto.currency),
      popular: PrismaFilter.equals(dto.popular),
      status: dto.status,
    }
    return where;
  }
}
