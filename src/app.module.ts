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

@Module({
  imports: [AuthModule, UserModule, PrismaModule, JwtModule, ConfigModule.forRoot({ isGlobal: true }), ModuleModule, RoleModule, MasterDataModule, RolePermissionModule, LeadModule],
  controllers: [AppController, ModuleController],
  providers: [AppService],
})
export class AppModule { }
