import { Module } from '@nestjs/common';
import { LinkedinAdsController } from './linkedin-ads.controller';
import { LinkedinAdsService } from './linkedin-ads.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '../jwt/jwt.module';
import { LeadModule } from '../lead/lead.module';
import { LinkedinAdsPolicy } from './linkedin-ads.policy';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [PrismaModule, JwtModule, LeadModule, PaymentsModule],
  controllers: [LinkedinAdsController],
  providers: [LinkedinAdsService, LinkedinAdsPolicy]
})
export class LinkedinAdsModule {}
