import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BulkImporter } from './importer.interface';
import { ImportJob, ImportRowStatus, LeadSource } from '@prisma/client';
import { getMappedOptionalEnum, getMappedValue, isColumnMapping } from 'src/common/helpers/object.helper';
import { parseDate } from 'src/common/helpers/date.helper';

@Injectable()
export class ContactImporterService implements BulkImporter {
    private readonly logger = new Logger(ContactImporterService.name);
    constructor(private readonly prisma: PrismaService) {}

    async import(rows: Record<string, any>[], importJob: ImportJob) {
        this.logger.log(`Importing ${rows.length} contacts`);
        const mapColumn = importJob?.columnMapping ?? {};
        if (!isColumnMapping(mapColumn)) {
            throw new BadRequestException('Invalid column mapping');
        }

        let successRows = 0;
        let failedRows = 0;

        for (let index = 0; index < rows.length; index++) {
            const row = rows[index];
            try {
                const [mailAddressRecord, otherAddressRecord] = await Promise.all([
                    this.prisma.address.create({ data: {
                        country: getMappedValue(row, mapColumn, 'mailingAddress.country', null),
                        flatHouseNo: getMappedValue(row, mapColumn, 'mailingAddress.flatHouseNo', null),
                        streetAddress: getMappedValue(row, mapColumn, 'mailingAddress.streetAddress', null),
                        city: getMappedValue(row, mapColumn, 'mailingAddress.city', null),
                        stateProvince: getMappedValue(row, mapColumn, 'mailingAddress.stateProvince', null),
                        postalCode: getMappedValue(row, mapColumn, 'mailingAddress.postalCode', null),
                        latitude: getMappedValue(row, mapColumn, 'mailingAddress.latitude', null),
                        longitude: getMappedValue(row, mapColumn, 'mailingAddress.longitude', null)
                    } }),
                    this.prisma.address.create({ data: {
                        country: getMappedValue(row, mapColumn, 'otherAddress.country', null),
                        flatHouseNo: getMappedValue(row, mapColumn, 'otherAddress.flatHouseNo', null),
                        streetAddress: getMappedValue(row, mapColumn, 'otherAddress.streetAddress', null),
                        city: getMappedValue(row, mapColumn, 'otherAddress.city', null),
                        stateProvince: getMappedValue(row, mapColumn, 'otherAddress.stateProvince', null),
                        postalCode: getMappedValue(row, mapColumn, 'otherAddress.postalCode', null),
                        latitude: getMappedValue(row, mapColumn, 'otherAddress.latitude', null),
                        longitude: getMappedValue(row, mapColumn, 'otherAddress.longitude', null)
                    }})
                ]);

                // const dob = getMappedValue(row, mapColumn, 'dateOfBirth', null);
                const contact = await this.prisma.contact.create({
                    data: {
                        createdById: importJob.createdById,
                        name: getMappedValue(row, mapColumn, 'name', ""),
                        title: getMappedValue(row, mapColumn, 'title', ""),
                        email: getMappedValue(row, mapColumn, 'email', null),
                        phone: getMappedValue(row, mapColumn, 'phone', null),
                        source: getMappedOptionalEnum(row, mapColumn, 'source', LeadSource, null),
                        fax: getMappedValue(row, mapColumn, 'fax', null),
                        assistant: getMappedValue(row, mapColumn, 'assistant', null),
                        assistantPhone: getMappedValue(row, mapColumn, 'assistantPhone', null),
                        department: getMappedValue(row, mapColumn, 'department', null),
                        dateOfBirth: parseDate(getMappedValue(row, mapColumn, 'dateOfBirth', null)),
                        skypeId: getMappedValue(row, mapColumn, 'skypeId', null),
                        twitter: getMappedValue(row, mapColumn, 'twitter', null),
                        description: getMappedValue(row, mapColumn, 'description', null),
                        mailingAddressId: mailAddressRecord?.id,
                        otherAddressId: otherAddressRecord?.id,
                    },
                });
                await this.prisma.importRow.create({
                    data: {
                        importJobId: importJob.id,
                        rowNumber: index + 1,
                        status: ImportRowStatus.SUCCESS,
                        data: row,
                        createdEntityId: contact.id,
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
            failed: failedRows
        }
    }
}