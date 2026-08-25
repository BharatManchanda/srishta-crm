import { Module } from '@nestjs/common';
import { NoteService } from './note.service';
import { NoteController } from './note.controller';
import { JwtModule } from '../jwt/jwt.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { NoteFilterBuilder } from './note-filter.builder';
import { NotePolicy } from './note.policy';
import { ActivityModule } from '../activity/activity.module';
import { NotificationModule } from '../notification/notification.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [PrismaModule, JwtModule, ActivityModule, NotificationModule, PaymentsModule],
  providers: [
    NoteService,
    PaginationService,
    UserHierarchyService,
    NoteFilterBuilder,
    NotePolicy,
  ],
  controllers: [NoteController],
})
export class NoteModule {}
