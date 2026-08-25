import { forwardRef, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivityModule } from '../activity/activity.module';
import { JwtModule } from '../jwt/jwt.module';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { UserPolicy } from '../user/user.policy';
import { UserModule } from '../user/user.module';

@Module({
  imports: [ConfigModule, PrismaModule, ActivityModule, JwtModule, forwardRef(() => UserModule),],
  controllers: [EmailController],
  providers: [EmailService, PaginationService],
  exports: [EmailService],
})
export class EmailModule {}
