import { Module } from '@nestjs/common';
import { BulkImportController } from './bulk-import.controller';
import { BulkImportService } from './bulk-import.service';
import { StorageService } from 'src/common/storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { CsvParserService } from 'src/common/csv-parse/csv-parser.service';
import { JwtModule } from '../jwt/jwt.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    JwtModule,
    BullModule.registerQueue({ name: 'bulk-import' }),
  ],
  controllers: [BulkImportController],
  providers: [BulkImportService, StorageService, PrismaService, CsvParserService],
})
export class BulkImportModule {}
