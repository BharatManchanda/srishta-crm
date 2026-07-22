import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '../jwt/jwt.module';
import { UserHierarchyService } from '../user/user-hierarchy.service';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [DashboardController],
  providers: [DashboardService, UserHierarchyService],
})
export class DashboardModule {}
