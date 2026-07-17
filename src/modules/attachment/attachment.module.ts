import { Module } from '@nestjs/common';
import { AttachmentController } from './attachment.controller';
import { AttachmentService } from './attachment.service';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '../jwt/jwt.module';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { StorageService } from 'src/common/storage/storage.service';
import { AttachmentFilterBuilder } from './attachment-filter.builder';
import { AttachmentPolicy } from './attachment.policy';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [PrismaModule, JwtModule, ActivityModule],
  controllers: [AttachmentController],
  providers: [
    AttachmentService,
    UserHierarchyService,
    PaginationService,
    StorageService,
    AttachmentFilterBuilder,
    AttachmentPolicy,
  ],
})
export class AttachmentModule {}
