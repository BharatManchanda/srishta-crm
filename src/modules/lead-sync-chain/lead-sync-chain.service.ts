import { Injectable, NotFoundException } from '@nestjs/common';
import { LeadSyncChainCreateDto } from './dto/lead-sync-chain-create.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { LeadSyncChainFilterDto } from './dto/lead-sync-chain-filter.dto';
import { LeadSyncChainFilterBuilder } from './lead-sync-chain.builder';

@Injectable()
export class LeadSyncChainService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly paginationService: PaginationService,
        private readonly leadSyncChainFilterBuilder: LeadSyncChainFilterBuilder
    ) {}

    async create(dto: LeadSyncChainCreateDto, userId:number) {
        const mappings = Object.entries(dto.mapping)
            .map(([crmField, facebookField])=>({
                crmField,
                facebookField
            }));

        return this.prisma.leadSyncChain.create({
            data:{
                createdById:userId,
                facebookAccountId: dto.facebookAccountId,
                facebookAdAccountId: dto.ad,
                facebookPageId: dto.page,
                facebookFormId: dto.form,
                module: dto.module,
                mappings:{
                    create: mappings
                }
            },
            include:{
                mappings:true
            }
        });
    }

    async get(dto: LeadSyncChainFilterDto, userId: number) {

        const where = {
            ...this.leadSyncChainFilterBuilder.build(dto),
            createdById: userId
        };

        const allowedSortFields = [
            "id",
            "facebookAccountId",
            "facebookAdAccountId",
            "facebookPageId",
            "facebookFormId",
            "module",
            "status",
            "createdAt",
        ];

        const sortBy = dto.sortBy && allowedSortFields.includes(dto.sortBy) ? dto.sortBy : "id";
        const orderBy = { [sortBy]: dto.sortOrder || "desc" };


        return this.paginationService.paginate(
            this.prisma.leadSyncChain,
            {
                page: dto.page,
                perPage: dto.perPage,
                where,
                orderBy,
                include: {
                    mappings: true,
                    facebookAccount: {
                        select: {
                            id: true,
                            facebookName: true
                        }
                    }
                }
            }
        );
    }

    async getOne(id: number, userId: number) {
        const leadSyncChain = await this.prisma.leadSyncChain.findFirst({
            where: {
                id,
                createdById: userId,
            },
            include: {
                mappings: true,
                facebookAccount: {
                    select: {
                        id: true,
                        facebookUserId: true,
                        facebookName: true,
                        // facebookEmail: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!leadSyncChain) {
            throw new NotFoundException("Lead sync chain not found");
        }

        return leadSyncChain;
    }

    async delete(id: number, userId: number) {
        const leadSyncChain = await this.prisma.leadSyncChain.findFirst({
            where: {
                id,
                createdById: userId,
            },
        });

        if (!leadSyncChain) {
            throw new NotFoundException("Lead sync chain not found");
        }

        return await this.prisma.leadSyncChain.delete({
            where: {
                id: leadSyncChain.id,
            },
        });
    }


}
