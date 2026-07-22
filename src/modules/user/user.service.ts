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
        bio: true,
        country: true,
        city: true,
        pincode: true,
        tax_id: true,
        facebookLink: true,
        twitterLink: true,
        linkdinLink: true,
        instagramLink: true,
        websiteLink: true,
        role: true,
        accessLevel: true,
        isSuperAdmin: true,
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

  async createDefaultUserView(userId: number) {
    const userModule = await this.prisma.module.findFirst({
      where: {
        path: '/user',
      },
    });
    if (!userModule) return;
    await this.prisma.userTableView.create({
      data: {
        userId: userId,
        moduleId: userModule.id,
        name: 'Default',
        isDefault: true,
        columns: {
          create: [
            { field: 'id', label: 'ID', visible: true, order: 1 },
            { field: 'name', label: 'Name', visible: true, order: 2 },
            { field: 'email', label: 'Email', visible: true, order: 3 },
            { field: 'phone', label: 'Phone', visible: true, order: 4 },
            { field: 'role', label: 'Role', visible: true, order: 5 },
            { field: 'status', label: 'Status', visible: true, order: 6 },
            { field: 'accessLevel', label: 'Access Level', visible: true, order: 7 },
            { field: 'createdAt', label: 'Created At', visible: false, order: 8 },
            { field: 'action', label: 'Action', visible: true, order: 9 },
          ],
        },
      },
    });
  }

  async viewSetting(authUserId: number) {
    const userModule = await this.prisma.module.findFirst({
      where: {
        path: '/user',
      },
    });
    if (!userModule) return;
    const viewSetting = await this.prisma.userTableView.findFirst({
      where: {
        userId: authUserId,
        isDefault: true,
        moduleId: userModule.id,
      },
      include: {
        columns: true,
      },
    });

    if (!viewSetting) {
      await this.createDefaultUserView(authUserId);
      return this.prisma.userTableView.findFirst({
        where: {
          userId: authUserId,
          isDefault: true,
          moduleId: userModule.id,
        },
        include: {
          columns: true,
        },
      });
    }
    return viewSetting;
  }

  async updateSetting(dto: any, authUserId: number) {
    const updatedColumns = await this.prisma.$transaction(
      dto.columns.map((column: any) =>
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
}
