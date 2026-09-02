import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContactInquiryCreateDto } from './dto/contact-inquiry-create.dto';
import { ContactInquiryStatus } from '@prisma/client';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { ContactInquiryFilterDto } from './dto/contact-inquiry-filter.dto';
import { ContactInquiryFilterBuilder } from './contact-filter.builder';
import { UpdateViewSettingDto } from './dto/contact-inquiry-view-setting.dto';
import { ContactInquiryUpdateDto } from './dto/contact-inquiry-update.dto';

@Injectable()
export class ContactInquiryService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly paginationService: PaginationService,
        private readonly contactInquiryFilterBuilder: ContactInquiryFilterBuilder,
    ) {}

    async getList(dto: ContactInquiryFilterDto) {
        const where: any = {
            ...this.contactInquiryFilterBuilder.build(dto),
        };
    
        const orderBy = dto.sortBy ? { [dto.sortBy]: dto.sortOrder || 'desc' } : { id: 'desc' };
        const result = await this.paginationService.paginate(this.prisma.contactInquiry, {
            page: dto.page,
            perPage: dto.perPage,
            where,
            orderBy,
        });
           
        return result;
    }

    async create(dto: ContactInquiryCreateDto) {
        const email = dto.email.trim().toLowerCase();

        const recentDuplicate = await this.prisma.contactInquiry.findFirst({
            where: {
                email,
                message: dto.message.trim(),
                createdAt: {
                    gte: new Date(Date.now() - 5 * 60 * 1000),
                },
            },
        });

        if (recentDuplicate) {
            return recentDuplicate;
        }

        const inquiry = await this.prisma.contactInquiry.create({
            data: {
                name: dto.name.trim(),
                email,
                phone: dto.phone?.trim() || null,
                company: dto.company?.trim() || null,
                website: dto.website?.trim() || null,
                inquiryType: dto.inquiryType,
                message: dto.message.trim(),
                status: ContactInquiryStatus.NEW,
            },
        });

        return inquiry;
    }

    async update(dto: ContactInquiryUpdateDto, id: number) {
        return await this.prisma.contactInquiry.update({
            where: {
                id,
            },
            data: {
                ...dto,
            },
        });
    }

    async viewSetting(authUserId: number) {
        const contactUsInquiry = await this.prisma.module.findFirst({
            where: {
                path: '/contact-inquiry',
            },
        });
        if (!contactUsInquiry) return;
        const viewSetting = await this.prisma.userTableView.findFirst({
            where: {
                userId: authUserId,
                isDefault: true,
                moduleId: contactUsInquiry.id,
            },
            include: {
                columns: true,
            },
        });
    
        if (!viewSetting) {
            await this.createDefaultContactUsInquiryView(authUserId);
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
    
    async updateSetting(dto: UpdateViewSettingDto, authUserId: number) {
        const updatedColumns = await this.prisma.$transaction(
            dto.columns.map((column) =>
                this.prisma.tableColumn.update({
                    where: {
                        id: column.id,
                    },
                    data: {
                        visible: column.visible,
                        ...(column.order !== undefined ? { order: column.order } : {}),
                    },
                }),
            ),
        );
        return updatedColumns;
    }

    async createDefaultContactUsInquiryView(userId: number) {
        const contactUsInquiryModule = await this.prisma.module.findUnique({
            where: {
                path: '/contact-inquiry',
            },
        });
        if (!contactUsInquiryModule) return;
        await this.prisma.userTableView.create({
            data: {
                userId: userId,
                moduleId: contactUsInquiryModule.id,
                name: 'Default',
                isDefault: true,
                columns: {
                    create: [
                        { field: 'id', label: 'ID', visible: true, order: 1 },
                        { field: 'name', label: 'Name', visible: true, order: 2 },
                        { field: 'email', label: 'Email', visible: false, order: 3 },
                        { field: 'phone', label: 'Phone', visible: true, order: 4 },
                        { field: 'company', label: 'Company', visible: true, order: 5 },
                        { field: 'inquiryType', label: 'Inquiry Type', visible: true, order: 6 },
                        { field: 'website', label: 'Website', visible: true, order: 7 },
                        { field: 'priority', label: 'Priority', visible: true, order: 8 },
                        { field: 'source', label: 'Source', visible: true, order: 9 },
                        { field: 'resolvedAt', label: 'Resolved At', visible: false, order: 10 },
                        { field: 'closedAt', label: 'Closed At', visible: false, order: 11 },
                        { field: 'createdAt', label: 'Created On', visible: false, order: 12, },
                        { field: 'updatedAt', label: 'Updated On', visible: false, order: 13, },
                        { field: 'status', label: 'Status', visible: true, order: 14 },
                        { field: 'action', label: 'Action', visible: true, order: 15 },
                    ],
                },
            },
        });
    }

    async getOne(id: number) {
        return this.prisma.contactInquiry.findUnique({
            where: {
                id,
            },
        });
    }
}
