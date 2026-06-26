import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContactFilterDto } from './dto/contact-filter.dto';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { ContactFilterBuilder } from './contact-filter.builder';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { UpdateViewSettingDto } from './dto/contact-view-setting.dto';
import { ContactCreateDto } from './dto/contact-create.dto';

@Injectable()
export class ContactService {

    constructor(
        private readonly prisma: PrismaService,
        private readonly paginationService: PaginationService,
        private readonly contactFilterBuilder: ContactFilterBuilder,
        private readonly userHierarchyService: UserHierarchyService,
    ) { }

    async getList(dto: ContactFilterDto, currentUserId: number) {
        const orderBy = dto.sortBy ? { [dto.sortBy]: dto.sortOrder || 'desc' } : { id: 'desc' };

        const result = await this.paginationService.paginate(this.prisma.contact, {
            page: dto.page,
            perPage: dto.perPage,
            where: {
                ...this.contactFilterBuilder.build(dto),
                createdById: {
                    in: await this.userHierarchyService.getFamilyUserIds(currentUserId),
                },
                id: {
                    in: (dto.id !== undefined && dto.id) ? [dto?.id] : undefined
                }
            },
            include: {
                mailingAddress: true,
                otherAddress: true,
            },
            orderBy,
        });
        return result;
    }
    async viewSetting(authUserId: number) {
        const contactModule = await this.prisma.module.findFirst({
            where: {
                path: '/contacts',
            },
        })
        if (!contactModule) return
        const viewSetting = await this.prisma.userTableView.findFirst({
            where: {
                userId: authUserId,
                isDefault: true,
                moduleId: contactModule.id
            },
            include: {
                columns: true,
            },
        });

        if (!viewSetting) {
            await this.createDefaultContactView(authUserId);
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
                    },
                })
            )
        );

        return updatedColumns;
    }

    async createDefaultContactView(userId: number) {
        const contactModule = await this.prisma.module.findUnique({
            where: {
                path: '/contacts',
            },
        });
        if (!contactModule) return;
        await this.prisma.userTableView.create({
            data: {
                userId: userId,
                moduleId: contactModule.id,
                name: 'Default',
                isDefault: true,
                columns: {
                    create: [
                        { field: 'id', label: 'ID', visible: true, order: 1 },
                        { field: 'createdById', label: 'Created By', visible: false, order: 2 },
                        { field: 'name', label: 'Name', visible: true, order: 3 },
                        { field: 'title', label: 'Title', visible: true, order: 4 },
                        { field: 'email', label: 'Email', visible: true, order: 5 },
                        { field: 'phone', label: 'Phone', visible: true, order: 6 },
                        { field: 'source', label: 'Source', visible: false, order: 7 },
                        { field: 'fax', label: 'Fax', visible: false, order: 8 },
                        { field: 'assistant', label: 'Assistant', visible: false, order: 9 },
                        { field: 'assistantPhone', label: 'Assistant Phone', visible: false, order: 10 },
                        { field: 'department', label: 'Department', visible: true, order: 11 },
                        { field: 'dateOfBirth', label: 'Date Of Birth', visible: false, order: 12 },
                        { field: 'skypeId', label: 'Skype ID', visible: false, order: 13 },
                        { field: 'twitter', label: 'Twitter', visible: false, order: 14 },
                        { field: 'mailingAddress.country', label: 'Mailing Country', visible: false, order: 15 },
                        { field: 'mailingAddress.city', label: 'Mailing City', visible: true, order: 16 },
                        { field: 'mailingAddress.stateProvince', label: 'Mailing State', visible: false, order: 17 },
                        { field: 'mailingAddress.postalCode', label: 'Mailing Postal Code', visible: false, order: 18 },
                        { field: 'mailingAddress.streetAddress', label: 'Mailing Address', visible: false, order: 19 },
                        { field: 'otherAddress.country', label: 'Other Country', visible: false, order: 20 },
                        { field: 'otherAddress.city', label: 'Other City', visible: false, order: 21, },
                        { field: 'otherAddress.stateProvince', label: 'Other State', visible: false, order: 22 },
                        { field: 'otherAddress.postalCode', label: 'Other Postal Code', visible: false, order: 23 },
                        { field: 'description', label: 'Description', visible: false, order: 24 },
                        { field: 'createdAt', label: 'Created At', visible: false, order: 25 },
                        { field: 'updatedAt', label: 'Updated At', visible: false, order: 26 },
                        { field: 'action', label: 'Action', visible: true, order: 27 },
                    ],
                },
            },
        });
    }
    async get(id: number) {
        return await this.prisma.contact.findFirst({
            where: {
                id: id,
            },
            include: {
                otherAddress: true,
                mailingAddress: true,
            },
        });
    }

    async create(dto: ContactCreateDto, authUserId: number) {
        try {
            const { mailingAddress, otherAddress, ...contactData } = dto;
    
            const [mailAddressRecord, otherAddressRecord] = await Promise.all([
                mailingAddress ? this.prisma.address.create({data: mailingAddress}) : null,
                otherAddress ? this.prisma.address.create({data: otherAddress}) : null,
            ]);
    
            return this.prisma.contact.create({
                data: {
                    ...contactData,
                    createdById: authUserId,
                    mailingAddressId: mailAddressRecord?.id,
                    otherAddressId: otherAddressRecord?.id,
                    dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
                },
            });
            
        } catch (error) {
            console.log(error, "::::error")
        }
    }

    async delete(id: number) {
        return this.prisma.contact.delete({
            where: {
                id: id,
            },
        });
    }
}
