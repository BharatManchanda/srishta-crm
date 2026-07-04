import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CsvParserService } from 'src/common/csv-parse/csv-parser.service';
import { ImportEntity, ImportStatus } from '@prisma/client';
import { LeadImporterService } from './importers/lead-importer.service';
import { ContactImporterService } from './importers/contact-importer.service';
import { AccountImporterService } from './importers/account-importer.service';

@Injectable()
@Processor('bulk-import')
export class BulkImportProcessor extends WorkerHost {
    private readonly logger = new Logger(BulkImportProcessor.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly csvParserService: CsvParserService,
        private readonly leadImporter: LeadImporterService,
        private readonly contactImporter: ContactImporterService,
        private readonly accountImporter: AccountImporterService,
    ) {
        super();
    }

    async process(job: Job): Promise<void> {
        this.logger.log(`Processing ${job.name} (Import Job ID: ${job.data.importJobId})`);

        const importJob = await this.prisma.importJob.findUnique({
            where: {
                id: job.data.importJobId,
            },
        });

        if (!importJob) {
            throw new Error(`ImportJob ${job.data.importJobId} does not exist.`);
        }

        try {
            await this.prisma.importJob.update({
                where: {
                    id: importJob.id,
                },
                data: {
                    status: ImportStatus.PROCESSING,
                },
            });
            const rows = await this.csvParserService.parse(importJob.storageKey);
            this.logger.log(`Import Job ${importJob.id} started processing.`);

            let result = {
                success: 0,
                failed: 0,
            };

            switch (importJob.entity) {
                case ImportEntity.LEAD:
                    result = await this.leadImporter.import(rows, importJob);
                    break;

                case ImportEntity.CONTACT:
                    result = await this.contactImporter.import(rows, importJob);
                    break;

                case ImportEntity.ACCOUNT:
                    result = await this.accountImporter.import(rows, importJob);
                    break;

                default:
                    throw new Error(`Unsupported import entity: ${importJob.entity}`);
            }

            await this.prisma.importJob.update({
                where: {
                    id: importJob.id,
                },
                data: {
                    status: ImportStatus.COMPLETED,
                    totalRows: rows.length,
                    successRows: result.success,
                    failedRows: result.failed,
                },
            });

            this.logger.log(`Import Job ${importJob.id} completed successfully.`);

            }
        catch (error) {
            this.logger.error(error);
            await this.prisma.importJob.update({
                where: {
                    id: importJob.id,
                },
                data: {
                    status: ImportStatus.FAILED,
                },
            });

            throw error;
        }
    }
}