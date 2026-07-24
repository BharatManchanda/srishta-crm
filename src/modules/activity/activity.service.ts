import { Get, Injectable, Query, Req } from "@nestjs/common";
import { CreateActivityDto } from "./dto/activity.dto";
import { PrismaService } from "../prisma/prisma.service";
import { ActivityFilterDto } from "./dto/activity-filter.dto";
import { UserHierarchyService } from "../user/user-hierarchy.service";
import { PaginationService } from "src/common/pagination/pagination.service";
import { ActivityFilterBuilder } from "./activity-filter.builder";

@Injectable()
export class ActivityService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly userHierarchyService: UserHierarchyService,
        private readonly paginationService: PaginationService,
        private readonly activityFilterBuilder: ActivityFilterBuilder
    ) {}
    async create(data: CreateActivityDto, authUserId: number) {
        return await this.prisma.activity.create({
            data: {
                entityType: data.entityType,
                entityId: data.entityId,
                action: data.action,
                description: data.description,
                metadata: data.metadata,
                createdById: authUserId,
            },
        });
    }

    @Get()
    async getList(dto: ActivityFilterDto, authUserId: number) {
        const userIds = await this.userHierarchyService.getFamilyUserIds(authUserId);
        const orderBy = dto.sortBy ? { [dto.sortBy]: dto.sortOrder || 'desc' } : { id: 'desc' };

        const result = await this.paginationService.paginate(this.prisma.activity, {
            page: dto.page,
            perPage: dto.perPage,
            paginate: dto?.paginate,
            where: {
                ...this.activityFilterBuilder.build(dto),
                createdById: {
                    in: userIds,
                },
                id: {
                    in: dto.id !== undefined && dto.id ? [dto?.id] : undefined,
                },
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy,
        });
        return result;
    }
}