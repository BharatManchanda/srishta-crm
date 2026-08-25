import { Injectable } from '@nestjs/common';
import { PrismaFilter } from 'src/common/filters/prisma-filter.helper';
import { PaymentFilterDto } from './dto/payment-filter.dto';

@Injectable()
export class PaymentFilterBuilder {
  build(dto: PaymentFilterDto) {
    const where: any = {
      // id: PrismaFilter.equals(dto.id),
      // entityType: PrismaFilter.equals(dto.entityType),
      // entityId: PrismaFilter.equals(dto.entityId),
      // isPinned: PrismaFilter.equals(dto.isPinned),
      // title: PrismaFilter.contains(dto.title),
      // content: PrismaFilter.contains(dto.content),
      // createdAt: PrismaFilter.dateRange(dto.createdFrom, dto.createdTo),
      // updatedAt: PrismaFilter.dateRange(dto.updatedFrom, dto.updatedTo),
    };

    // if (dto.createdById) {
    //   const parsedId = Number(dto.createdById);
    //   if (!isNaN(parsedId)) {
    //     where.createdById = parsedId;
    //   } else {
    //     where.createdBy = {
    //       name: {
    //         contains: dto.createdById,
    //         mode: 'insensitive',
    //       },
    //     };
    //   }
    // }

    return where;
  }
}
