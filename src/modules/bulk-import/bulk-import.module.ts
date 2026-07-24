import { Module } from '@nestjs/common';
import { BulkImportController } from './bulk-import.controller';
import { BulkImportService } from './bulk-import.service';
import { StorageService } from 'src/common/storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { CsvParserService } from 'src/common/csv-parse/csv-parser.service';
import { JwtModule } from '../jwt/jwt.module';
import { BullModule } from '@nestjs/bullmq';
import { BulkImportProcessor } from './bulk-import.processor';
import { LeadImporterService } from './importers/lead-importer.service';
import { ContactImporterService } from './importers/contact-importer.service';
import { AccountImporterService } from './importers/account-importer.service';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { BulkImportFilterBuilder } from './bulk-import-filter.builder';

import { NotificationModule } from '../notification/notification.module';
import { UserHierarchyService } from '../user/user-hierarchy.service';

@Module({
  imports: [
    JwtModule,
    NotificationModule,
    BullModule.registerQueue({ name: 'bulk-import' }),
  ],
  controllers: [BulkImportController],
  providers: [
    BulkImportService,
    StorageService,
    PrismaService,
    CsvParserService,
    BulkImportProcessor,
    LeadImporterService,
    ContactImporterService,
    AccountImporterService,
    PaginationService,
    BulkImportFilterBuilder,
    UserHierarchyService
  ],
})
export class BulkImportModule { }
