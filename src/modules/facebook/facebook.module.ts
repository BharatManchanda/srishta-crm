import { Module } from '@nestjs/common';
import { FacebookController } from './facebook.controller';
import { FacebookService } from './facebook.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '../jwt/jwt.module';
import { LeadService } from '../lead/lead.service';
import { LeadModule } from '../lead/lead.module';
import { FacebookPolicy } from './facebook.policy';

@Module({
  imports: [PrismaModule, JwtModule, LeadModule],
  controllers: [FacebookController],
  providers: [FacebookService, FacebookPolicy]
})
export class FacebookModule {}
