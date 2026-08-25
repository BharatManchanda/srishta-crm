import { Module } from '@nestjs/common';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { JwtModule } from '../jwt/jwt.module';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { WhatsappPolicy } from './whatsapp.policy';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [JwtModule, PaymentsModule],
  controllers: [WhatsappController],
  providers: [WhatsappService, PrismaService, PaginationService, WhatsappPolicy],
  exports: [WhatsappService]
})
export class WhatsappModule { }
