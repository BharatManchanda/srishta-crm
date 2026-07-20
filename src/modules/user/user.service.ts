import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { RegisterDto } from '../auth/dto/register-user.dto';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { UserFilterDto } from './dto/user-filter.dto';
import { UserFilterBuilder } from './user-filter.builder';
import { UpdateUserDto } from '../auth/dto/update-user.dto';
import { UserPolicy } from './user.policy';
import { ChangePasswordDto } from '../auth/dto/change-password.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly paginationService: PaginationService,
    private readonly userFilterBuilder: UserFilterBuilder,
    private readonly userPolicy: UserPolicy,
    ) { }

  async getList(dto: UserFilterDto, currentUserId: number) {
    const orderBy = dto.sortBy
      ? { [dto.sortBy]: dto.sortOrder || 'desc' }
      : { id: 'desc' };
    const accessibleUserIds = await this.userPolicy.getAccessibleUserIds(currentUserId);
    const result = await this.paginationService.paginate(this.prisma.user, {
      page: dto.page,
      perPage: dto.perPage,
      where: {
        ...this.userFilterBuilder.build(dto),
        id: {
          in: dto.id !== undefined && dto.id ? [dto?.id] : accessibleUserIds,
        },
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
    return this.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        accessLevel: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            children: true,
            tableViews: true,
            createdRoles: true,
            createdContacts: true,
            createdAccounts: true,
            createdNotes: true,
            createdAttachments: true,
            createdLeads: true,
            createdTasks: true,
            createdCalls: true,
            meetingCalls: true,
            assignedLeads: true,
            createdImportJob: true,
            createdActivities: true,
          },
        },
      },
    });
  }

  async delete(id: number) {
    return this.prisma.$transaction(async (tx) => {
      // Get all table view ids of this user
      const tableViews = await tx.userTableView.findMany({
        where: { userId: id },
        select: { id: true },
      });

      const tableViewIds = tableViews.map((v) => v.id);

      // Delete grandchildren
      if (tableViewIds.length) {
        await tx.tableColumn.deleteMany({
          where: {
            tableViewId: {
              in: tableViewIds,
            },
          },
        });
      }

      // Delete children
      await tx.userTableView.deleteMany({
        where: {
          userId: id,
        },
      });

      // Delete parent
      return tx.user.delete({
        where: {
          id,
        },
      });
    });
  }

  async update(dto: UpdateUserDto, authUserId: number, userId: number) {
    return this.authService.update(dto, authUserId, userId);
  }

  async create(dto: RegisterDto, authUserId: number) {
    return this.authService.register(dto, authUserId);
  }

  async changePassword(dto: ChangePasswordDto, authUserId: number, userId: number) {
    return this.authService.changePassword(dto, authUserId, userId);
  }
}
