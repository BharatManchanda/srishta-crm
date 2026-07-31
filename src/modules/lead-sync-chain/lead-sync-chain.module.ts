import { Module } from '@nestjs/common';
import { LeadSyncChainController } from './lead-sync-chain.controller';
import { LeadSyncChainService } from './lead-sync-chain.service';
import { JwtModule } from '../jwt/jwt.module';
import { PrismaModule } from '../prisma/prisma.module';
import { LeadSyncChainFilterBuilder } from './lead-sync-chain.builder';
import { PaginationService } from 'src/common/pagination/pagination.service';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [LeadSyncChainController],
  providers: [LeadSyncChainService, LeadSyncChainFilterBuilder, PaginationService],
})
export class LeadSyncChainModule {}
