import { Injectable } from '@nestjs/common';
import { PrismaFilter } from 'src/common/filters/prisma-filter.helper';
import { LeadSyncChainFilterDto } from './dto/lead-sync-chain-filter.dto';

@Injectable()
export class LeadSyncChainFilterBuilder {
  constructor() {}

  build(dto: LeadSyncChainFilterDto) {
    return {
      facebookAccountId: dto.facebookAccountId ? Number(dto.facebookAccountId) : undefined,

      facebookAdAccountId: PrismaFilter.contains(dto.facebookAdAccountId),

      facebookPageId: PrismaFilter.contains(dto.facebookPageId),

      facebookFormId: PrismaFilter.contains(dto.facebookFormId),

      provider: dto.provider,

      module: dto.module,

      status: dto.status,

      mappings: dto.crmField || dto.facebookField ? {
        some: {
          crmField: PrismaFilter.contains(dto.crmField),
          facebookField: PrismaFilter.contains(dto.facebookField),
        },
      } : undefined,


    };
  }
}