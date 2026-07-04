import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BulkImporter } from './importer.interface';
import { ImportJob, LeadSource } from '@prisma/client';
import { getMappedOptionalEnum, getMappedValue, isColumnMapping } from 'src/common/helpers/object.helper';

@Injectable()
export class ContactImporterService implements BulkImporter {
    private readonly logger = new Logger(ContactImporterService.name);
    constructor(private readonly prisma: PrismaService) {}

    async import(rows: Record<string, any>[], importJob: ImportJob): Promise<void> {
        this.logger.log(`Importing ${rows.length} contacts`);
        const mapColumn = importJob?.columnMapping ?? {};
        if (!isColumnMapping(mapColumn)) {
            throw new Error('Invalid column mapping');
        }

        for (const row of rows) {
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
            const dob = getMappedValue(row, mapColumn, 'dateOfBirth', null);
            await this.prisma.contact.create({
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
                    dateOfBirth: dob ? new Date(dob) : undefined,
                    skypeId: getMappedValue(row, mapColumn, 'skypeId', null),
                    twitter: getMappedValue(row, mapColumn, 'twitter', null),
                    description: getMappedValue(row, mapColumn, 'description', null),
                    mailingAddressId: mailAddressRecord?.id,
                    otherAddressId: otherAddressRecord?.id,
                },
            });
        }
    }
}