import { Module } from '@nestjs/common';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';
import { JwtModule } from '../jwt/jwt.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PricingFilterBuilder } from './pricing-filter.builder';

@Module({
    imports: [PrismaModule, JwtModule],
    controllers: [PricingController],
    providers: [PricingService, PricingFilterBuilder],
})
export class PricingModule {}
