import { Module } from '@nestjs/common';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { CompaniesFilterBuilder } from './companies-filter.builder';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { JwtModule } from '../jwt/jwt.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [PrismaModule, JwtModule, UserModule],
  controllers: [CompaniesController],
  providers: [CompaniesFilterBuilder, CompaniesService, PaginationService],
})
export class CompaniesModule {}
