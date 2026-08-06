import { Module } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';
import { JwtModule } from '../jwt/jwt.module';
import { NotificationService } from './notification.service';
import { PrismaModule } from '../prisma/prisma.module';
import { OnlineUserService } from './online-user.service';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { NotificationController } from './notification.controller';
import { FollowUpCronService } from './follow-up-cron.service';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [JwtModule, PrismaModule, WhatsappModule],
  controllers: [NotificationController],
  providers: [NotificationGateway, NotificationService, OnlineUserService, PaginationService, FollowUpCronService],
  exports: [
    NotificationService,
    NotificationGateway,
  ],
})
export class NotificationModule { }
