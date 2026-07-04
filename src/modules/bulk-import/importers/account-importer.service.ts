import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BulkImporter } from './importer.interface';
import { AccountRating, AccountType, ImportJob, OwnershipType } from '@prisma/client';
import { getMappedOptionalEnum, getMappedValue, isColumnMapping } from 'src/common/helpers/object.helper';

@Injectable()
export class AccountImporterService implements BulkImporter {
    private readonly logger = new Logger(AccountImporterService.name);
    constructor(private readonly prisma: PrismaService) {}

    async import(rows: Record<string, any>[], importJob: ImportJob): Promise<void> {
        this.logger.log(`Importing ${rows.length} accounts`);
        const mapColumn = importJob?.columnMapping ?? {};
        if (!isColumnMapping(mapColumn)) {
            throw new Error('Invalid column mapping');
        }

        for (const row of rows) {
            const [billingAddress, shippingAddress] = await Promise.all([
                this.prisma.address.create({ data: {
                    country: getMappedValue(row, mapColumn, 'billingAddress.country', null),
                    flatHouseNo: getMappedValue(row, mapColumn, 'billingAddress.flatHouseNo', null),
                    streetAddress: getMappedValue(row, mapColumn, 'billingAddress.streetAddress', null),
                    city: getMappedValue(row, mapColumn, 'billingAddress.city', null),
                    stateProvince: getMappedValue(row, mapColumn, 'billingAddress.stateProvince', null),
                    postalCode: getMappedValue(row, mapColumn, 'billingAddress.postalCode', null),
                    latitude: getMappedValue(row, mapColumn, 'billingAddress.latitude', null),
                    longitude: getMappedValue(row, mapColumn, 'billingAddress.longitude', null)
                }}),
                this.prisma.address.create({ data: {
                    country: getMappedValue(row, mapColumn, 'shippingAddress.country', null),
                    flatHouseNo: getMappedValue(row, mapColumn, 'shippingAddress.flatHouseNo', null),
                    streetAddress: getMappedValue(row, mapColumn, 'shippingAddress.streetAddress', null),
                    city: getMappedValue(row, mapColumn, 'shippingAddress.city', null),
                    stateProvince: getMappedValue(row, mapColumn, 'shippingAddress.stateProvince', null),
                    postalCode: getMappedValue(row, mapColumn, 'shippingAddress.postalCode', null),
                    latitude: getMappedValue(row, mapColumn, 'shippingAddress.latitude', null),
                    longitude: getMappedValue(row, mapColumn, 'shippingAddress.longitude', null)
                }})
            ]);

            const employyeeValue = getMappedValue(row, mapColumn, 'employees', null);
            const numberOfEmployees = employyeeValue ? Number(employyeeValue) : null;

            await this.prisma.account.create({
                data: {
                    createdById: importJob.createdById,
                    accountName: getMappedValue(row, mapColumn, 'accountName', ""),
                    accountSite: getMappedValue(row, mapColumn, 'accountSite', null),
                    parentAccountId: getMappedValue(row, mapColumn, 'parentAccountId', null),
                    accountNumber: getMappedValue(row, mapColumn, 'accountNumber', null),
                    accountType: getMappedOptionalEnum(row, mapColumn, 'accountType', AccountType, null),
                    industry: getMappedValue(row, mapColumn, 'industry', null),
                    annualRevenue: getMappedValue(row, mapColumn, 'annualRevenue', null),
                    rating: getMappedOptionalEnum(row, mapColumn, 'accountType', AccountRating, null),
                    phone: getMappedValue(row, mapColumn, 'phone', null),
                    fax: getMappedValue(row, mapColumn, 'fax', null),
                    website: getMappedValue(row, mapColumn, 'website', null),
                    tickerSymbol: getMappedValue(row, mapColumn, 'tickerSymbol', null),
                    ownership: getMappedOptionalEnum(row, mapColumn, 'accountType', OwnershipType, null),
                    employees: numberOfEmployees,
                    sicCode: getMappedValue(row, mapColumn, 'sicCode', null),
                    billingAddressId: billingAddress?.id,
                    shippingAddressId: shippingAddress?.id,
                    description: getMappedValue(row, mapColumn, 'description', null),
                },
            });
        }
    }
}