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

}
