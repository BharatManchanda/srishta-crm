import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { BlogsFilterDto } from './dto/blogs-filter.dto';
import { LeadFilterBuilder } from '../lead/lead-filter.builder';
import { BlogsFilterBuilder } from './blogs-filter.builder';
import { UpdateViewSettingDto } from './dto/update-view-setting.dto';
import { CreateBlogDto } from './dto/blogs-create.dto';
import { UpdateBlogDto } from './dto/blogs-update.dto';

@Injectable()
export class BlogsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly paginationService: PaginationService,
        private readonly blogsFilterBuilder: BlogsFilterBuilder,
    ) { }


    async getList(dto: BlogsFilterDto) {
        const where: any = {
            ...this.blogsFilterBuilder.build(dto),
            id: {
                in: dto.id !== undefined && dto.id ? [dto?.id] : undefined,
            },
        }
        const orderBy = dto.sortBy ? { [dto.sortBy]: dto.sortOrder || 'desc' } : { id: 'desc' };
        const result = await this.paginationService.paginate(this.prisma.blogPost, {
            page: dto.page,
            perPage: dto.perPage,
            paginate: dto?.paginate,
            where,
            include: {
                author: true,
                category: true,
            },
            orderBy,
        });
        
        return result;
    }

    async getCategoriesList() {
        const result = await this.prisma.blogCategory.findMany();
        return result;
    }

    async viewSetting(authUserId: number) {
        const blogModule = await this.prisma.module.findFirst({
            where: {
                path: '/blogs',
            },
        });

        if (!blogModule) return;
        const viewSetting = await this.prisma.userTableView.findFirst({
            where: {
                userId: authUserId,
                isDefault: true,
                moduleId: blogModule.id,
            },
            include: {
                columns: true,
            },
        });
    
        if (!viewSetting) {
            await this.createDefaultBlogView(authUserId);
            return this.prisma.userTableView.findFirst({
                where: {
                    userId: authUserId,
                    isDefault: true,
                    moduleId: blogModule.id,
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
            dto.columns.map((column) => this.prisma.tableColumn.update({
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

    async create(dto: CreateBlogDto, userId: number) {
        const existingBlog = await this.prisma.blogPost.findUnique({
            where: {
                slug: dto.slug,
            },
        });

        if (existingBlog) {
            throw new ForbiddenException('A blog with this slug already exists.');
        }

        try {
            const blog = await this.prisma.blogPost.create({
                data: {
                    authorId: userId,
                    ...dto,
                },
            });
        } catch (error) {
            console.error('Error creating blog:', error);
            throw error;
        }
    }
    async createDefaultBlogView(userId: number) {
        const blogModule = await this.prisma.module.findUnique({
            where: {
                path: '/blogs',
            },
        });

        if (!blogModule) return;

        await this.prisma.userTableView.create({
            data: {
                userId,
                moduleId: blogModule.id,
                name: 'Default',
                isDefault: true,
                columns: {
                    create: [
                        { field: 'id', label: 'ID', visible: true, order: 1 },
                        { field: 'title', label: 'Title', visible: true, order: 2 },
                        { field: 'slug', label: 'Slug', visible: false, order: 3 },
                        { field: 'authorId', label: 'Author', visible: true, order: 4 },
                        { field: 'categoryId', label: 'Category', visible: true, order: 5 },
                        { field: 'author', label: 'Author', visible: true, order: 6 },
                        { field: 'category', label: 'Category', visible: true, order: 7 },
                        { field: 'status', label: 'Status', visible: true, order: 8 },
                        { field: 'publishedAt', label: 'Published At', visible: true, order: 9 },
                        { field: 'featuredImage', label: 'Featured Image', visible: false, order: 10 },
                        { field: 'metaTitle', label: 'Meta Title', visible: false, order: 11 },
                        { field: 'metaDescription', label: 'Meta Description', visible: false, order: 12 },
                        { field: 'canonicalUrl', label: 'Canonical URL', visible: false, order: 13 },
                        { field: 'createdAt', label: 'Created At', visible: false, order: 14 },
                        { field: 'updatedAt', label: 'Updated At', visible: false, order: 15 },
                        { field: 'action', label: 'Action', visible: true, order: 16 },
                    ],
                },
            },
        });
    }

    async getOne(id: number) {
        const blog = await this.prisma.blogPost.findUnique({
            where: { id },
            include: {
                author: true,
                category: true,
            },
        });

        if (!blog) {
            throw new NotFoundException("Blog not found");
        }

        return blog;
    }

    async getBySlug(slug: string) {
        const blog = await this.prisma.blogPost.findUnique({
            where: { slug },
            include: {
                author: true,
                category: true,
            },
        });

        if (!blog) {
            throw new NotFoundException("Blog not found");
        }

        return blog;
    }
    
    async update(id: number, dto: UpdateBlogDto, authUserId: number) {
        try {
            const blogPost =  await this.prisma.blogPost.update({
                where: { id },
                data: {
                    ...dto,
                }
            });
    
            return blogPost;

        } catch (error) {
            console.error('Error updating blog:', error);
            throw error;
        }
    }
}
