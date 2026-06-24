import { Module } from '@nestjs/common';
import { LeadController } from './lead.controller';
import { LeadService } from './lead.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { LeadFilterBuilder } from './lead-filter.builder';
import { JwtModule } from '../jwt/jwt.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule, JwtModule],
  controllers: [LeadController],
  providers: [LeadService, PaginationService, LeadFilterBuilder],
})
export class LeadModule {}
