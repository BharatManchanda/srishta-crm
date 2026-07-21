import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivityModule } from '../activity/activity.module';
import { JwtModule } from '../jwt/jwt.module';

@Module({
  imports: [ConfigModule, PrismaModule, ActivityModule, JwtModule],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
