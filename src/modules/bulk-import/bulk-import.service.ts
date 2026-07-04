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

@Injectable()
export class BulkImportService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly paginationService: PaginationService,

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

        const where: any = {
            createdById: authUserId,
        };

        if (dto.entity) {
            where.entity = dto.entity;
        }

        if (dto.status) {
            where.status = dto.status;
        }

        if (dto.search) {
            where.fileName = {
                contains: dto.search,
                mode: 'insensitive',
            };
        }

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

        const where: any = {};

        if (dto.importJobId) {
            where.importJobId = dto.importJobId;
        }

        if (dto.status) {
            where.status = dto.status;
        }

        if (dto.entity) {
            where.importJob = {
                entity: dto.entity,
            };
        }

        if (dto.search) {
            where.OR = [
                {
                    error: {
                        contains: dto.search,
                        mode: 'insensitive',
                    },
                },
                {
                    data: {
                        path: ['name'],
                        string_contains: dto.search,
                    },
                },
                {
                    data: {
                        path: ['Name'],
                        string_contains: dto.search,
                    },
                },
                {
                    data: {
                        path: ['email'],
                        string_contains: dto.search,
                    },
                },
                {
                    data: {
                        path: ['Email'],
                        string_contains: dto.search,
                    },
                },
                {
                    data: {
                        path: ['phone'],
                        string_contains: dto.search,
                    },
                },
                {
                    data: {
                        path: ['Phone'],
                        string_contains: dto.search,
                    },
                },
                {
                    data: {
                        path: ['accountName'],
                        string_contains: dto.search,
                    },
                },
                {
                    data: {
                        path: ['Account Name'],
                        string_contains: dto.search,
                    },
                },
            ];
        }

        return this.paginationService.paginate(this.prisma.importRow, {
            page: dto.page,
            perPage: dto.perPage,
            where,
            orderBy,
            include: {
                importJob: true,
            },
        });
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
