import { Module } from '@nestjs/common';
import { GoogleCalendarController } from './google-calendar.controller';
import { GoogleCalendarService } from './google-calendar.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtModule } from '../jwt/jwt.module';
import { GoogleCalendarSyncService } from '../../common/cronjob/google-calendar-sync-events.service';

@Module({
  imports: [JwtModule],
  controllers: [GoogleCalendarController],
  providers: [GoogleCalendarService, PrismaService, GoogleCalendarSyncService]
})
export class GoogleCalendarModule {}
