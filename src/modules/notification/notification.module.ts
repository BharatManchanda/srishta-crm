import { Module } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';
import { JwtModule } from '../jwt/jwt.module';
import { NotificationService } from './notification.service';
import { PrismaModule } from '../prisma/prisma.module';
import { OnlineUserService } from './online-user.service';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { NotificationController } from './notification.controller';

@Module({
  imports: [JwtModule, PrismaModule],
  controllers: [NotificationController],
  providers: [NotificationGateway, NotificationService, OnlineUserService, PaginationService],
  exports: [
    NotificationService,
    NotificationGateway,
  ],
})
export class NotificationModule { }
