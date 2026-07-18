import { Module } from '@nestjs/common';
import { GoogleCalendarController } from './google-calendar.controller';
import { GoogleCalendarService } from './google-calendar.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtModule } from '../jwt/jwt.module';
import { GoogleCalendarSyncService } from '../../common/cronjob/google-calendar-sync-events.service';
import { BullModule } from '@nestjs/bullmq';
import { GoogleCalendarSyncProcessor } from './google-calendar-sync.processor';

@Module({
  imports: [
    JwtModule,
    BullModule.registerQueue({ name: 'google-calendar-sync' }),
  ],
  controllers: [GoogleCalendarController],
  providers: [
    GoogleCalendarService,
    PrismaService,
    GoogleCalendarSyncService,
    GoogleCalendarSyncProcessor,
  ],
  exports: [GoogleCalendarService, BullModule],
})
export class GoogleCalendarModule { }
