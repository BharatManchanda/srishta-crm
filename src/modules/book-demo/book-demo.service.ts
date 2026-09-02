import { ForbiddenException, Injectable } from '@nestjs/common';
import { BookDemoFilterBuilder } from './book-demo-filter.builder';
import { CreateBookDemoDto } from './dto/book-demo-create.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { UpdateViewSettingDto } from '../blogs/dto/update-view-setting.dto';
import { BookDemoFilterDto } from './dto/book-demo-filter.dto';
import { UpdateBookDemoDto } from './dto/book-demo-update.dto';

@Injectable()
export class BookDemoService {
    constructor(
        private readonly paginationService: PaginationService,
        private readonly prismaService: PrismaService,
        private readonly bookDemoFilterBuilder: BookDemoFilterBuilder,
    ) { }
    async getList(dto: BookDemoFilterDto, currentUser: any) {
        const orderBy = dto.sortBy ? { [dto.sortBy]: dto.sortOrder || 'desc' } : { id: 'desc' };

        const result = await this.paginationService.paginate(this.prismaService.bookDemo, {
            page: dto.page,
            perPage: dto.perPage,
            where: {
                ...this.bookDemoFilterBuilder.build(dto),
            },
            orderBy,
        });

        return result;
    }

    async create(dto: CreateBookDemoDto) {
        return await this.prismaService.bookDemo.create({
            data: {
                ...dto,
            },
        });
    }

    async update(dto: UpdateBookDemoDto, id: number) {
        const bookDemo =  await this.prismaService.bookDemo.update({
            where: { id },
            data: {
                ...dto,
            }
        });
        return bookDemo;
    }

    async delete(id: number) {
        const bookDemo = await this.prismaService.bookDemo.findUnique({
            where: { id },
        });

        if (!bookDemo) {
            throw new ForbiddenException('Book demo not found');
        }

        const deletedBookDemo = await this.prismaService.bookDemo.delete({
            where: { id },
        });

        return deletedBookDemo;
    }

    async viewSetting(authUserId: number) {
        const bookDemoModule = await this.prismaService.module.findFirst({
            where: {
                path: '/book-demos',
            },
        });

        if (!bookDemoModule) return;
        const viewSetting = await this.prismaService.userTableView.findFirst({
            where: {
                userId: authUserId,
                isDefault: true,
                moduleId: bookDemoModule.id,
            },
            include: {
                columns: true,
            },
        });
    
        if (!viewSetting) {
            await this.createDefaultBookDemoView(authUserId);
            return this.prismaService.userTableView.findFirst({
                where: {
                    userId: authUserId,
                    isDefault: true,
                    moduleId: bookDemoModule.id,
                },
                include: {
                    columns: true,
                },
            });
        }
        return viewSetting;
    }
    
    async updateSetting(dto: UpdateViewSettingDto) {
        const updatedColumns = await this.prismaService.$transaction(
            dto.columns.map((column) => this.prismaService.tableColumn.update({
                where: {
                    id: column.id,
                },
                data: {
                    visible: column.visible,
                    ...(column.order !== undefined ? { order: column.order } : {}),
                },
            })),
        );
        return updatedColumns;
    }

    async createDefaultBookDemoView(userId: number) {
        const bookDemoModule = await this.prismaService.module.findUnique({
            where: {
                path: '/book-demos',
            },
        });

        if (!bookDemoModule) return;

        await this.prismaService.userTableView.create({
            data: {
                userId,
                moduleId: bookDemoModule.id,
                name: 'Default',
                isDefault: true,
                columns: {
                    create: [
                        { field: 'id', label: 'ID', visible: true, order: 1 },
                        { field: 'name', label: 'Name', visible: true, order: 2 },
                        { field: 'email', label: 'Email', visible: true, order: 3 },
                        { field: 'phone', label: 'Phone', visible: true, order: 4 },
                        { field: 'company', label: 'Company', visible: true, order: 5 },
                        { field: 'teamSize', label: 'Team Size', visible: true, order: 6 },
                        { field: 'industry', label: 'Industry', visible: true, order: 7 },
                        { field: 'message', label: 'Message', visible: true, order: 8 },
                        { field: 'status', label: 'Status', visible: true, order: 9 },
                        { field: 'createdAt', label: 'Created At', visible: false, order: 10 },
                        { field: 'updatedAt', label: 'Updated At', visible: false, order: 11 },
                        { field: 'action', label: 'Action', visible: true, order: 12 },
                    ],
                },
            },
        });
    }

    async getOne(id: number) {
        return await this.prismaService.bookDemo.findUnique({
            where: { id },
        });
    }
}
