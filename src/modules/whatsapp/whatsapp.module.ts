import { Module } from '@nestjs/common';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { JwtModule } from '../jwt/jwt.module';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationService } from 'src/common/pagination/pagination.service';

@Module({
  imports: [JwtModule],
  controllers: [WhatsappController],
  providers: [WhatsappService, PrismaService, PaginationService]
})
export class WhatsappModule { }
