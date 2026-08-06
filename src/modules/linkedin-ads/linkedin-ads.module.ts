import { Module } from '@nestjs/common';
import { LinkedinAdsController } from './linkedin-ads.controller';
import { LinkedinAdsService } from './linkedin-ads.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '../jwt/jwt.module';
import { LeadModule } from '../lead/lead.module';

@Module({
  imports: [PrismaModule, JwtModule, LeadModule],
  controllers: [LinkedinAdsController],
  providers: [LinkedinAdsService]
})
export class LinkedinAdsModule {}
