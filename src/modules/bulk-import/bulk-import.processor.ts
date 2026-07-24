import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CsvParserService } from 'src/common/csv-parse/csv-parser.service';
import { ImportEntity, ImportStatus } from '@prisma/client';
import { LeadImporterService } from './importers/lead-importer.service';
import { ContactImporterService } from './importers/contact-importer.service';
import { AccountImporterService } from './importers/account-importer.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '@prisma/client';

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
        private readonly notificationService: NotificationService,
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
            throw new BadRequestException(`ImportJob ${job.data.importJobId} does not exist.`);
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
                    throw new BadRequestException(`Unsupported import entity: ${importJob.entity}`);
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

            // Send success notification to CEO and creator
            try {
                const ceoUsers = await this.prisma.user.findMany({
                    where: {
                        role: {
                            name: {
                                equals: 'CEO',
                                mode: 'insensitive',
                            },
                        },
                    },
                    select: {
                        id: true,
                    },
                });
                const recipientIds = Array.from(
                    new Set([importJob.createdById, ...ceoUsers.map((u) => u.id)]),
                );

                await this.notificationService.create({
                    title: 'CSV Import Completed',
                    message: `The CSV import job for ${importJob.entity.toLowerCase()} completed successfully. Success: ${result.success}, Failed: ${result.failed}.`,
                    type: NotificationType.SUCCESS,
                    module: 'IMPORT',
                    entityId: importJob.id,
                    createdBy: importJob.createdById,
                    userIds: recipientIds,
                });
            } catch (notifError) {
                this.logger.error('Failed to send success notification:', notifError);
            }

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

            // Send failure notification to CEO and creator
            try {
                const ceoUsers = await this.prisma.user.findMany({
                    where: {
                        role: {
                            name: {
                                equals: 'CEO',
                                mode: 'insensitive',
                            },
                        },
                    },
                    select: {
                        id: true,
                    },
                });
                const recipientIds = Array.from(
                    new Set([importJob.createdById, ...ceoUsers.map((u) => u.id)]),
                );

                await this.notificationService.create({
                    title: 'CSV Import Failed',
                    message: `The CSV import job for ${importJob.entity.toLowerCase()} failed due to an error: ${error instanceof Error ? error.message : 'Unknown error'}.`,
                    type: NotificationType.ERROR,
                    module: 'IMPORT',
                    entityId: importJob.id,
                    createdBy: importJob.createdById,
                    userIds: recipientIds,
                });
            } catch (notifError) {
                this.logger.error('Failed to send failure notification:', notifError);
            }

            throw error;
        }
    }
}