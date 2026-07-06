import { Injectable } from '@nestjs/common';
import { BulkImportCreateDto } from './dto/bulk-import-create-dto.dto';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ImportStatus } from '@prisma/client';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { ImportJobFilterDto } from './dto/import-job-filter.dto';
import { ImportRowFilterDto } from './dto/import-row-filter.dto';
import { UpdateViewSettingDto } from './dto/update-view-setting.dto';
import { BulkImportFilterBuilder } from './bulk-import-filter.builder';

@Injectable()
export class BulkImportService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly paginationService: PaginationService,
        private readonly filterBuilder: BulkImportFilterBuilder,

        @InjectQueue('bulk-import')
        private readonly bulkImportQueue: Queue,
    ) { }

    async create(dto: BulkImportCreateDto, authUserId: number) {
        const importJob = await this.prisma.importJob.create({
            data: {
                ...dto,
                createdById: authUserId,
                status: ImportStatus.PENDING,
            },
        });

        // 2. Add job to queue
        await this.bulkImportQueue.add(`${dto.entity}-import`, // e.g. lead-import
            {
                importJobId: importJob.id,
            },
            {
                attempts: 3,
                removeOnComplete: 100,
                removeOnFail: 100,
            },
        );

        // 3. Return immediately
        return importJob;
    }

    async getList(dto: ImportJobFilterDto, authUserId: number) {
        const orderBy = dto.sortBy
            ? { [dto.sortBy]: dto.sortOrder || 'desc' }
            : { id: 'desc' };

        const where = this.filterBuilder.buildJob(dto, authUserId);

        return this.paginationService.paginate(this.prisma.importJob, {
            page: dto.page,
            perPage: dto.perPage,
            where,
            orderBy,
        });
    }

    async getListRows(dto: ImportRowFilterDto) {
        const orderBy = dto.sortBy
            ? { [dto.sortBy]: dto.sortOrder || 'desc' }
            : { id: 'desc' };

        const where = this.filterBuilder.buildRow(dto);

        const paginationResult = await this.paginationService.paginate(this.prisma.importRow, {
            page: dto.page,
            perPage: dto.perPage,
            where,
            orderBy,
            include: {
                importJob: true,
            },
        });

        const rows = paginationResult.data;

        // Group createdEntityIds by entity type
        const leadIds: number[] = [];
        const contactIds: number[] = [];
        const accountIds: number[] = [];

        rows.forEach((row) => {
            if (row.createdEntityId && row.importJob) {
                if (row.importJob.entity === 'LEAD') {
                    leadIds.push(row.createdEntityId);
                } else if (row.importJob.entity === 'CONTACT') {
                    contactIds.push(row.createdEntityId);
                } else if (row.importJob.entity === 'ACCOUNT') {
                    accountIds.push(row.createdEntityId);
                }
            }
        });

        // Fetch entities in parallel
        const [leads, contacts, accounts] = await Promise.all([
            leadIds.length ? this.prisma.lead.findMany({ where: { id: { in: leadIds } } }) : Promise.resolve([]),
            contactIds.length ? this.prisma.contact.findMany({ where: { id: { in: contactIds } } }) : Promise.resolve([]),
            accountIds.length ? this.prisma.account.findMany({ where: { id: { in: accountIds } } }) : Promise.resolve([]),
        ]);

        // Create quick lookup maps
        const leadsMap = new Map<number, any>(leads.map((l) => [l.id, l] as [number, any]));
        const contactsMap = new Map<number, any>(contacts.map((c) => [c.id, c] as [number, any]));
        const accountsMap = new Map<number, any>(accounts.map((a) => [a.id, a] as [number, any]));

        // Attach created entity data to each row
        const mappedRows = rows.map((row) => {
            let createdEntity: any = null;
            if (row.createdEntityId && row.importJob) {
                if (row.importJob.entity === 'LEAD') {
                    createdEntity = leadsMap.get(row.createdEntityId);
                } else if (row.importJob.entity === 'CONTACT') {
                    createdEntity = contactsMap.get(row.createdEntityId);
                } else if (row.importJob.entity === 'ACCOUNT') {
                    createdEntity = accountsMap.get(row.createdEntityId);
                }
            }
            return {
                ...row,
                createdEntity,
            };
        });

        return {
            ...paginationResult,
            data: mappedRows,
        };
    }

    async createDefaultImportView(userId: number) {
        const importModule = await this.prisma.module.findUnique({
            where: {
                path: '/imports',
            },
        });
        if (!importModule) return;

        await this.prisma.userTableView.create({
            data: {
                userId: userId,
                moduleId: importModule.id,
                name: 'Default',
                isDefault: true,
                columns: {
                    create: [
                        { field: 'id', label: 'ID', visible: true, order: 1 },
                        { field: 'fileName', label: 'File Name', visible: true, order: 2 },
                        { field: 'entity', label: 'Entity Type', visible: true, order: 3 },
                        { field: 'totalRows', label: 'Total Rows', visible: true, order: 4 },
                        { field: 'successRows', label: 'Success Rows', visible: true, order: 5 },
                        { field: 'failedRows', label: 'Failed Rows', visible: true, order: 6 },
                        { field: 'status', label: 'Status', visible: true, order: 7 },
                        { field: 'createdAt', label: 'Created At', visible: true, order: 8 },
                        { field: 'action', label: 'Action', visible: true, order: 9 },
                    ],
                },
            },
        });
    }

    async viewSetting(authUserId: number) {
        const importModule = await this.prisma.module.findFirst({
            where: {
                path: '/imports',
            },
        });
        if (!importModule) return;

        const viewSetting = await this.prisma.userTableView.findFirst({
            where: {
                userId: authUserId,
                isDefault: true,
                moduleId: importModule.id,
            },
            include: {
                columns: true,
            },
        });

        if (!viewSetting) {
            await this.createDefaultImportView(authUserId);
            return this.prisma.userTableView.findFirst({
                where: {
                    userId: authUserId,
                    isDefault: true,
                    moduleId: importModule.id,
                },
                include: {
                    columns: true,
                },
            });
        }
        return viewSetting;
    }

    async updateSetting(dto: UpdateViewSettingDto, authUserId: number) {
        const updatedColumns = await this.prisma.$transaction(
            dto.columns.map((column) =>
                this.prisma.tableColumn.update({
                    where: {
                        id: column.id,
                    },
                    data: {
                        visible: column.visible,
                    },
                }),
            ),
        );

        return updatedColumns;
    }

    async findOne(id: number) {
        return this.prisma.importJob.findUnique({
            where: {
                id,
            },
        });
    }
}
