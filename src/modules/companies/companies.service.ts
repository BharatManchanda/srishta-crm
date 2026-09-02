import { Injectable } from '@nestjs/common';
import { CompaniesFilterDto } from './dto/companies-filter.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { CompaniesFilterBuilder } from './companies-filter.builder';
import { UserType } from '@prisma/client';
import { UserPolicy } from '../user/user.policy';

@Injectable()
export class CompaniesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly paginationService: PaginationService,
        private readonly companiesFilterBuilder: CompaniesFilterBuilder,
        private readonly userPolicy: UserPolicy,
    ) {}

    async getList(dto: CompaniesFilterDto) {
        const orderBy = dto.sortBy ? { [dto.sortBy]: dto.sortOrder || 'desc' } : { id: 'desc' };

        const result = await this.paginationService.paginate(this.prisma.user, {
            page: dto.page,
            perPage: dto.perPage,
            where: {
                ...this.companiesFilterBuilder.build(dto),
                isSuperAdmin: true,
                userType: UserType.USER,
            },
            orderBy,
            include: {
                role: {
                select: {
                    id: true,
                    name: true,
                },
                },
            },
        });
        return result;
    }

    async getOne(id: number) {
        const accessibleUserIds = await this.userPolicy.getAccessibleUserIds(id);

        const [company, userCount, paymentCount, leadCount, contactCount, accountCount, roleCount, noteCount, attachmentCount, taskCount, callCount, meetingCallCount, importJobCount, activityCount, dealCount] = await Promise.all([
            this.prisma.user.findUnique({
                where: {
                    id,
                },
                include: {
                    role: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            }),

            this.prisma.user.count({
                where: {
                    id: {
                        in: accessibleUserIds,
                    },
                },
            }),

            this.prisma.payment.count({
                where: {
                    userId: {
                        in: accessibleUserIds,
                    },
                },
            }),

            this.prisma.lead.count({
                where: {
                    createdById: {
                        in: accessibleUserIds,
                    },
                },
            }),

            this.prisma.contact.count({
                where: {
                    createdById: {
                        in: accessibleUserIds,
                    },
                },
            }),

            this.prisma.account.count({
                where: {
                    createdById: {
                        in: accessibleUserIds,
                    },
                },
            }),

            this.prisma.role.count({
                where: {
                    createdById: {
                        in: accessibleUserIds,
                    },
                },
            }),

            this.prisma.note.count({
                where: {
                    createdById: {
                        in: accessibleUserIds,
                    },
                },
            }),

            this.prisma.attachment.count({
                where: {
                    createdById: {
                        in: accessibleUserIds,
                    },
                },
            }),

            this.prisma.task.count({
                where: {
                    createdById: {
                        in: accessibleUserIds,
                    },
                },
            }),

            this.prisma.call.count({
                where: {
                    createdById: {
                        in: accessibleUserIds,
                    },
                },
            }),

            this.prisma.meeting.count({
                where: {
                    createdById: {
                        in: accessibleUserIds,
                    },
                },
            }),

            this.prisma.importJob.count({
                where: {
                    createdById: {
                        in: accessibleUserIds,
                    },
                },
            }),

            this.prisma.activity.count({
                where: {
                    createdById: {
                        in: accessibleUserIds,
                    },
                },
            }),

            this.prisma.deal.count({
                where: {
                    createdById: {
                        in: accessibleUserIds,
                    },
                },
            }),
        ]);

        if (!company) {
            throw new Error('Company not found');
        }

        return {
            ...company,
            _count: {
                users: userCount,
                payments: paymentCount,
                createdLeads: leadCount,
                createdContacts: contactCount,
                createdAccounts: accountCount,
                createdRoles: roleCount,
                createdNotes: noteCount,
                createdAttachments: attachmentCount,
                createdTasks: taskCount,
                createdCalls: callCount,
                meetingCalls: meetingCallCount,
                createdImportJob: importJobCount,
                createdActivities: activityCount,
                createdDeales: dealCount,
            },
        };
    }
}
