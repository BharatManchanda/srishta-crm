import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { ActivityFilterBuilder } from './activity-filter.builder';
import { JwtModule } from '../jwt/jwt.module';

@Module({
    imports: [PrismaModule, JwtModule],
    controllers: [ActivityController],
    providers: [
        ActivityService,
        UserHierarchyService,
        PaginationService,
        ActivityFilterBuilder,
    ],
    exports: [ActivityService],
})
export class ActivityModule {}
