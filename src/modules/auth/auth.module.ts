import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '../jwt/jwt.module';
import { EmailModule } from '../email/email.module';
import { GoogleService } from './google.service';

@Module({
  imports: [PrismaModule, JwtModule, EmailModule],
  controllers: [AuthController],
  providers: [AuthService, GoogleService],
  exports: [AuthService, GoogleService],
})
export class AuthModule {}

