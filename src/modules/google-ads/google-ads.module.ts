import { Module } from '@nestjs/common';
import { GoogleAdsController } from './google-ads.controller';
import { GoogleAdsService } from './google-ads.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '../jwt/jwt.module';
import { LeadService } from '../lead/lead.service';
import { LeadModule } from '../lead/lead.module';
import { GoogleAdsPolicy } from './google-ads.policy';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [PrismaModule, JwtModule, LeadModule, PaymentsModule],
  controllers: [GoogleAdsController],
  providers: [GoogleAdsService, GoogleAdsPolicy],
  exports: [GoogleAdsService],
})
export class GoogleAdsModule {}
