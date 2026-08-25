import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { JwtModule } from './modules/jwt/jwt.module';
import { ConfigModule } from '@nestjs/config';
import { ModuleController } from './modules/module/module.controller';
import { ModuleModule } from './modules/module/module.module';
import { RoleModule } from './modules/role/role.module';
import { MasterDataModule } from './modules/master-data/master-data.module';
import { UserModule } from './modules/user/user.module';
import { RolePermissionModule } from './modules/role-permission/role-permission.module';
import { LeadModule } from './modules/lead/lead.module';
import { ContactModule } from './modules/contact/contact.module';
import { AccountModule } from './modules/account/account.module';
import { NoteModule } from './modules/note/note.module';
import { AttachmentModule } from './modules/attachment/attachment.module';
import { TaskModule } from './modules/task/task.module';
import { CallModule } from './modules/call/call.module';
import { MeetingModule } from './modules/meeting/meeting.module';
import { BulkImportModule } from './modules/bulk-import/bulk-import.module';
import { BullModule } from '@nestjs/bullmq';
import { ExportModule } from './modules/export/export.module';
import { ActivityModule } from './modules/activity/activity.module';
import { GoogleCalendarModule } from './modules/google-calendar/google-calendar.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AiModule } from './modules/ai/ai.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { NotificationModule } from './modules/notification/notification.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { FacebookModule } from './modules/facebook/facebook.module';
import { LeadSyncChainModule } from './modules/lead-sync-chain/lead-sync-chain.module';
import { GoogleAdsModule } from './modules/google-ads/google-ads.module';
import { CronjobModule } from './common/cronjob/cronjob.module';
import { LinkedinAdsModule } from './modules/linkedin-ads/linkedin-ads.module';
import { ModuleFieldModule } from './modules/module-field/module-field.module';
import { DealModule } from './modules/deal/deal.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { RedisModule } from './modules/redis/redis.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    PrismaModule,
    JwtModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ModuleModule,
    RoleModule,
    MasterDataModule,
    RolePermissionModule,
    LeadModule,
    ContactModule,
    AccountModule,
    NoteModule,
    AttachmentModule,
    TaskModule,
    CallModule,
    MeetingModule,
    BulkImportModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT as unknown as number,
      },
    }),
    ExportModule,
    ActivityModule,
    GoogleCalendarModule,
    AiModule,
    DashboardModule,
    NotificationModule,
    WhatsappModule,
    FacebookModule,
    LeadSyncChainModule,
    GoogleAdsModule,
    CronjobModule,
    LinkedinAdsModule,
    ModuleFieldModule,
    DealModule,
    PricingModule,
    PaymentsModule,
    RedisModule,
  ],
  controllers: [AppController, ModuleController],
  providers: [AppService],
})
export class AppModule { }
