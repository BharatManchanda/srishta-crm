import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { JwtModule } from './modules/jwt/jwt.module';
import { ConfigModule } from '@nestjs/config';
import { ModuleController } from './modules/module/module.controller';
import { ModuleModule } from './modules/module/module.module';

@Module({
  imports: [AuthModule, PrismaModule, JwtModule, ConfigModule.forRoot({isGlobal: true}), ModuleModule],
  controllers: [AppController, ModuleController],
  providers: [AppService],
})
export class AppModule {}
