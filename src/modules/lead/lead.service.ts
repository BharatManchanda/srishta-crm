import { Injectable } from '@nestjs/common';
import { LeadFilterDto } from './dto/lead-filter.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { LeadFilterBuilder } from './lead-filter.builder';
import { LeadCreateDto } from './dto/lead-create.dto';
import { Prisma } from '@prisma/client';
import { LeadUpdateDto } from './dto/lead-update.dto';
// import { LeadPolicy } from './lead.policy';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { UpdateViewSettingDto } from './dto/update-view-setting.dto';

@Injectable()
export class LeadService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly paginationService: PaginationService,
        private readonly leadFilterBuilder: LeadFilterBuilder,
        private readonly userHierarchyService: UserHierarchyService,
    ) { }
    async getList(dto: LeadFilterDto, currentUserId: number) {
        const userIds = await this.userHierarchyService.getFamilyUserIds(currentUserId);
        const orderBy = dto.sortBy ? { [dto.sortBy]: dto.sortOrder || 'desc' } : { id: 'desc' };

        const result = await this.paginationService.paginate(this.prisma.lead, {
            page: dto.page,
            perPage: dto.perPage,
            where: {
                ...this.leadFilterBuilder.build(dto),
                createdById: {
                    in: userIds,
                },
            },
            orderBy,
        });
        return result;
    }

    async create(dto: LeadCreateDto, authUserId: number) {
        return this.prisma.lead.create({
            data: {
                ...dto,

                budget: dto.budget ? new Prisma.Decimal(dto.budget) : null,
                createdById: authUserId,
            },
        });
    }

    async get(id: number) {
        return this.prisma.lead.findFirst({
            where: {
                id: id,
            },
        });
    }

    async update(dto: LeadUpdateDto, id: number) {
        return this.prisma.lead.update({
            where: {
                id: id,
            },
            data: {
                ...dto,
                budget: dto.budget ? new Prisma.Decimal(dto.budget) : null,
            },
        });
    }

    async delete(id: number) {
        return this.prisma.lead.delete({
            where: {
                id: id,
            },
        });
    }

    async createDefaultLeadView(userId: number) {
        const leadModule = await this.prisma.module.findUnique({
            where: {
                path: '/leads',
            },
        });
        if (!leadModule) return;
        await this.prisma.userTableView.create({
            data: {
                userId: userId,
                moduleId: leadModule.id,
                name: 'Default',
                isDefault: true,
                columns: {
                    create: [
                        { field: 'id', label: 'ID', visible: true, order: 1 },
                        { field: 'createdById', label: 'Created By', visible: false, order: 2 },
                        { field: 'name', label: 'Name', visible: true, order: 3 },
                        { field: 'title', label: 'Title', visible: false, order: 4 },
                        { field: 'email', label: 'Email', visible: true, order: 5 },
                        { field: 'phone', label: 'Phone', visible: true, order: 6 },
                        { field: 'website', label: 'Website', visible: true, order: 7 },
                        { field: 'city', label: 'City', visible: true, order: 8 },
                        { field: 'state', label: 'State', visible: false, order: 9 },
                        { field: 'pinCode', label: 'Pin Code', visible: false, order: 10 },
                        { field: 'country', label: 'Country', visible: false, order: 11 },
                        { field: 'address', label: 'Address', visible: false, order: 12 },
                        { field: 'industry', label: 'Industry', visible: false, order: 13 },
                        { field: 'source', label: 'Source', visible: false, order: 14 },
                        { field: 'budget', label: 'Budget', visible: false, order: 15 },
                        { field: 'priority', label: 'Priority', visible: false, order: 16 },
                        { field: 'rating', label: 'Rating', visible: false, order: 17 },
                        { field: 'leadScore', label: 'LeadScore', visible: false, order: 18 },
                        { field: 'isQualified', label: 'Is Qualified', visible: false, order: 19 },
                        { field: 'isConverted', label: 'Is Converted', visible: false, order: 20 },
                        { field: 'assignedToId', label: 'Assigned To', visible: false, order: 21 },
                        { field: 'nextFollowUpDate', label: 'Next FollowUp Date', visible: false, order: 22 },
                        { field: 'lastFollowUpDate', label: 'Last FollowUp Date', visible: false, order: 23 },
                        { field: 'status', label: 'Status', visible: true, order: 24 },
                        { field: 'createdAt', label: 'Created At', visible: false, order: 25 },
                        { field: 'updatedAt', label: 'Updated At', visible: false, order: 26 },
                        { field: 'action', label: 'Action', visible: true, order: 27 },
                    ],
                },
            },
        });
    }

    async viewSetting(authUserId: number) {
        const viewSetting = await this.prisma.userTableView.findFirst({
            where: {
                userId: authUserId,
                isDefault: true,
            },
            include: {
                columns: true,
            },
        });

        if (!viewSetting) {
            await this.createDefaultLeadView(authUserId);
            return this.prisma.userTableView.findFirst({
                where: {
                    userId: authUserId,
                    isDefault: true,
                },
                include: {
                    columns: true,
                },
            });
        }
        return viewSetting;
    }


    async updateSetting(
        dto: UpdateViewSettingDto,
        authUserId: number,
    ) {
        const updatedColumns = await this.prisma.$transaction(
            dto.columns.map((column) =>
                this.prisma.tableColumn.update({
                    where: {
                        id: column.id,
                    },
                    data: {
                        visible: column.visible,
                    },
                })
            )
        );

        return updatedColumns;
    }
}
