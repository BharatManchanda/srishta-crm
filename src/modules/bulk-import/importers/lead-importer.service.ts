import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BulkImporter } from './importer.interface';
import { ImportJob, ImportRowStatus, LeadPriority, LeadRating, LeadSource, LeadStatus } from '@prisma/client';
import { getMappedOptionalEnum, getMappedRequiredEnum, getMappedValue, hasKeyWithValue, isColumnMapping } from 'src/common/helpers/object.helper';
import { parseDate } from 'src/common/helpers/date.helper';
import { parseBoolean } from 'src/common/helpers/boolean.helper';

@Injectable()
export class LeadImporterService implements BulkImporter {
  private readonly logger = new Logger(LeadImporterService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

    async import(rows: Record<string, any>[], importJob: ImportJob) {
        this.logger.log(`Importing ${rows.length} leads`);
        const mapColumn = importJob?.columnMapping ?? {};
        if (!isColumnMapping(mapColumn)) {
            throw new Error('Invalid column mapping');
        }

        let successRows = 0;
        let failedRows = 0;

        for (let index = 0; index < rows.length; index++) {
            const row = rows[index];
            try {
                let leadScore = getMappedValue(row, mapColumn, 'leadScore', 0);
                leadScore = Number(leadScore) ?? 0;
                const lead = await this.prisma.lead.create({
                    data: {
                        createdById: importJob.createdById,
                        name: getMappedValue(row, mapColumn, 'name', ""),
                        title: getMappedValue(row, mapColumn, 'title', null),
                        email: getMappedValue(row, mapColumn, 'email', ""),
                        phone: getMappedValue(row, mapColumn, 'phone', null),
                        website: getMappedValue(row, mapColumn, 'website', null),
    
                        city: getMappedValue(row, mapColumn, 'city', null),
                        state: getMappedValue(row, mapColumn, 'state', null),
                        pinCode: getMappedValue(row, mapColumn, 'pinCode', null),
                        country: getMappedValue(row, mapColumn, 'country', null),
                        address: getMappedValue(row, mapColumn, 'address', null),
    
                        industry: getMappedValue(row, mapColumn, 'industry', null),
                        budget: getMappedValue(row, mapColumn, 'budget', null),
                        requirement: getMappedValue(row, mapColumn, 'requirement', null),
    
                        source: getMappedOptionalEnum(row, mapColumn, 'source', LeadSource, null),
                        status: getMappedRequiredEnum(row, mapColumn, 'status', LeadStatus, LeadStatus.NEW),
                        priority: getMappedRequiredEnum(row, mapColumn, 'priority', LeadPriority, LeadPriority.MEDIUM),
                        rating: getMappedOptionalEnum(row, mapColumn, 'rating', LeadRating, null),
    
                        leadScore: leadScore,
                        isQualified: parseBoolean(getMappedValue(row, mapColumn, 'isQualified', false)),
                        isConverted: parseBoolean(getMappedValue(row, mapColumn, 'isConverted', false)),
                        
                        nextFollowUpDate: parseDate(getMappedValue(row, mapColumn, 'nextFollowUpDate', null)),
                        lastFollowUpDate: parseDate(getMappedValue(row, mapColumn, 'lastFollowUpDate', null)),
    
                        description: getMappedValue(row, mapColumn, 'description', null),
                    },
                });
                await this.prisma.importRow.create({
                    data: {
                        importJobId: importJob.id,
                        rowNumber: index + 1,
                        status: ImportRowStatus.SUCCESS,
                        data: row,
                        createdEntityId: lead.id,
                    },
                });
                successRows++;
            } catch (error) {
                failedRows++;

                await this.prisma.importRow.create({
                    data: {
                        importJobId: importJob.id,
                        rowNumber: index + 1,
                        status: ImportRowStatus.FAILED,
                        data: row,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    },
                });

                this.logger.warn(`Row ${index + 1} failed: ${error instanceof Error ? error.message : error}`);
            }
        }

        return {
            success: successRows,
            failed: failedRows,
        }
    }
}