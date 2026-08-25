import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PricingPlanStatus, Prisma } from '@prisma/client';
import { UpdateViewSettingDto } from './dto/update-view-setting.dto';
import { CreatePlanModuleDto } from './dto/create-plan-module.dto';
import { CreatePricingPlanDto } from './dto/create-pricing-plan.dto';
import { UpdatePricingPlanDto } from './dto/update-pricing-plan.dto';
import { PricingFilterBuilder } from './pricing-filter.builder';
import { PricingPlanFilterDto } from './dto/pricing-filter.dto';

@Injectable()
export class PricingService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly pricingPlanBuilder: PricingFilterBuilder,
    ) {}

    private readonly planInclude = {
        planModules: {
            orderBy: {
                sortOrder: 'asc' as const,
            },
            include: {
                module: true,
            },
        },
    }

    private mapPlanModule(module: CreatePlanModuleDto) {
        return {
        moduleId: module.moduleId,
        enabled: module.enabled ?? false,
        limit: module.limit ?? null,
        displayValue: module.displayValue ?? null,
        featureLabel: module.featureLabel ?? null,
        featureDescription: module.featureDescription ?? null,
        actions: module.actions ?? [],
        sortOrder: module.sortOrder ?? 0,
        };
    }

    private async validateModules(modules?: CreatePlanModuleDto[]) {
        if (!modules || modules.length === 0) {
            return;
        }

        const moduleIds = [...new Set(modules.map((item) => item.moduleId))];

        const existingModules = await this.prisma.module.findMany({
            where: {
                id: {
                    in: moduleIds,
                },
            },
            select: {
                id: true,
            },
        });

        const existingIds = new Set(existingModules.map((item) => item.id));
        const invalidIds = moduleIds.filter((moduleId) => !existingIds.has(moduleId));

        if (invalidIds.length > 0) {
            throw new BadRequestException(`Invalid module IDs: ${invalidIds.join(', ')}`,);
        }
    }
    
    async list(dto: PricingPlanFilterDto) {
        return await this.prisma.pricingPlan.findMany({
            where: {
                ...this.pricingPlanBuilder.build(dto),
            },
            orderBy: {
                sortOrder: "asc",
            },
            include: {
                planModules: {
                    include: {
                        module: true,
                    },
                    orderBy: {
                        module: {
                            pricingOrder: "asc",
                        },
                    },
                },
            },
        });
    }

    async viewSetting(authUserId: number) {
        const pricePlanModule = await this.prisma.module.findFirst({
            where: {
                path: '/pricing-plans',
            },
        });

        if (!pricePlanModule) return;
        const viewSetting = await this.prisma.userTableView.findFirst({
            where: {
                userId: authUserId,
                isDefault: true,
                moduleId: pricePlanModule.id,
            },
            include: {
                columns: true,
            },
        });

        if (!viewSetting) {
            await this.createDefaultPricingView(authUserId);
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

    async createDefaultPricingView(userId: number) {
        const leadModule = await this.prisma.module.findUnique({
            where: {
                path: '/pricing-plans',
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
                { field: 'name', label: 'Name', visible: true, order: 2 },
                { field: 'slug', label: 'Slug', visible: true, order: 4 },
                { field: 'title', label: 'Title', visible: false, order: 5 },
                { field: 'monthlyPrice', label: 'Monthly Price', visible: true, order: 6 },
                { field: 'yearlyPrice', label: 'Yearly Price', visible: true, order: 7 },
                { field: 'website', label: 'Website', visible: true, order: 8 },
                { field: 'currency', label: 'Currency', visible: true, order: 9 },
                { field: 'popular', label: 'Popular', visible: false, order: 10 },
                { field: 'status', label: 'Status', visible: false, order: 11 },
                { field: 'createdAt', label: 'Created At', visible: false, order: 12, },
                { field: 'updatedAt', label: 'Updated At', visible: false, order: 13, },
                { field: 'action', label: 'Action', visible: true, order: 14 },
            ],
            },
        },
        });
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

    async get(id: number) {
        return await this.prisma.pricingPlan.findUnique({
            where: {
                id: id,
            },
            include: {
                planModules: {
                    include: {
                        module: true,
                    },
                },
            },
        });
    }

    async create(dto: CreatePricingPlanDto) {
        const name = dto.name.trim();
        const slug = dto.slug.trim().toLowerCase();
        await this.validateModules(dto.planModules);
        
        const existingPlan = await this.prisma.pricingPlan.findFirst({
            where: {
                OR: [{ name }, { slug }]
            },
            select: {
                id: true,
                name: true,
                slug: true,
            },
        });

        if (existingPlan) {
            if (existingPlan.name === name) {
                throw new ConflictException('A pricing plan with this name already exists.');
            }
            throw new ConflictException('A pricing plan with this slug already exists.');
        }

        return this.prisma.$transaction(
            async (tx) => {
                const plan = await tx.pricingPlan.create({
                    data: {
                        name,
                        slug,
                        description: dto.description?.trim() || null,
                        monthlyPrice: new Prisma.Decimal(dto.monthlyPrice),
                        yearlyPrice: new Prisma.Decimal(dto.yearlyPrice),
                        currency: dto.currency || 'INR',
                        popular: dto.popular ?? false,
                        sortOrder: dto.sortOrder ?? 0,
                        status: dto.status ?? 'ACTIVE',
                        cta: dto.cta?.trim() || 'Get Started',
                        planModules: dto.planModules && dto.planModules.length > 0 ? {
                            create: dto.planModules.map((module) => this.mapPlanModule(module)),
                        } : undefined,
                    },
                    include: this.planInclude,
                });
                return plan;
            }
        );
    }

    async update(id: number, dto: UpdatePricingPlanDto) {
        const existingPlan = await this.prisma.pricingPlan.findUnique({
            where: { id },
        });

        if (!existingPlan) {
            throw new NotFoundException('Pricing plan not found.');
        }

        await this.validateModules(dto.planModules);
        const name = dto.name?.trim();
        const slug = dto.slug?.trim().toLowerCase();

        if (name || slug) {
            const duplicate = await this.prisma.pricingPlan.findFirst({
                where: {
                    id: {
                        not: id,
                    },
                    OR: [
                        ...(name ? [{ name }] : []),
                        ...(slug ? [{ slug }] : []),
                    ],
                },

                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            });

            if (duplicate) {
                if (name && duplicate.name === name) {
                    throw new ConflictException('A pricing plan with this name already exists.');
                }

                if (slug && duplicate.slug === slug) {
                    throw new ConflictException('A pricing plan with this slug already exists.');
                }
            }
        }

        
        return this.prisma.$transaction(async (tx) => {
            const plan =
            await tx.pricingPlan.update({
                where: { id },
                data: {
                    ...(name !== undefined && { name }),
                    ...(slug !== undefined && { slug }),
                    ...(dto.description !== undefined && {
                        description:
                        dto.description?.trim() ||
                        null,
                    }),

                    ...(dto.monthlyPrice !== undefined && {
                        monthlyPrice:
                        new Prisma.Decimal(dto.monthlyPrice),
                    }),

                    ...(dto.yearlyPrice !== undefined && {
                        yearlyPrice:
                        new Prisma.Decimal(
                            dto.yearlyPrice,
                        ),
                    }),

                    ...(dto.currency !== undefined && {
                        currency:
                        dto.currency,
                    }),

                    ...(dto.popular !== undefined && {
                        popular:
                        dto.popular,
                    }),

                    ...(dto.sortOrder !== undefined && {
                        sortOrder:
                        dto.sortOrder,
                    }),

                    ...(dto.status !== undefined && {
                        status:
                        dto.status,
                    }),

                    ...(dto.cta !== undefined && {
                        cta:
                        dto.cta.trim(),
                    }),
                },
            });

            if (dto.planModules !== undefined) {
                await tx.planModule.deleteMany({
                    where: {
                    planId: id,
                    },
                });

                if (dto.planModules.length > 0) {
                    await tx.planModule.createMany({
                        data: dto.planModules.map((module) => ({
                            planId: id,
                            ...this.mapPlanModule(module),
                        })),
                    });
                }
            }

            return tx.pricingPlan.findUnique({
                where: {
                    id: plan.id,
                },
                include: this.planInclude,
            });
        });
    }

    async remove(id: number) {
        const existingPlan = await this.prisma.pricingPlan.findUnique({
            where: { id },
            select: {
                id: true,
            },
        });

        if (!existingPlan) {
            throw new NotFoundException('Pricing plan not found.');
        }

        await this.prisma.pricingPlan.delete({
            where: {
                id,
            },
        });

        return { message: 'Pricing plan deleted successfully.' };
    }

    async bulkDelete(ids: number[]) {
        const deletedDeals: any[] = [];
        for (const id of ids) {
            const deleted = await this.remove(id);
            deletedDeals.push(deleted);
        }
        return deletedDeals;
    }
}
