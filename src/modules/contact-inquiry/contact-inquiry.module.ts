import { Module } from '@nestjs/common';
import { ContactInquiryController } from './contact-inquiry.controller';
import { ContactInquiryService } from './contact-inquiry.service';
import { ContactInquiryFilterBuilder } from './contact-filter.builder';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { JwtModule } from '../jwt/jwt.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [ContactInquiryController],
  providers: [ContactInquiryService, ContactInquiryFilterBuilder, PaginationService]
})
export class ContactInquiryModule {}
