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
    const orderBy = dto.sortBy ? { [dto.sortBy]: dto.sortOrder || 'desc' } : { id: 'desc' };
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
            { field: 'bio', label: 'Bio', visible: false, order: 8 },
            { field: 'country', label: 'Country', visible: false, order: 9 },
            { field: 'city', label: 'City', visible: false, order: 10 },
            { field: 'pincode', label: 'Pincode', visible: false, order: 11 },
            { field: 'tax_id', label: 'Tax ID', visible: false, order: 12 },
            { field: 'facebookLink', label: 'Facebook Link', visible: false, order: 13 },
            { field: 'twitterLink', label: 'Twitter Link', visible: false, order: 14 },
            { field: 'linkdinLink', label: 'LinkedIn Link', visible: false, order: 15 },
            { field: 'instagramLink', label: 'Instagram Link', visible: false, order: 16 },
            { field: 'websiteLink', label: 'Website Link', visible: false, order: 17 },
            { field: 'createdAt', label: 'Created At', visible: false, order: 18 },
            { field: 'action', label: 'Action', visible: true, order: 19 },
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
    let viewSetting = await this.prisma.userTableView.findFirst({
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
      viewSetting = await this.prisma.userTableView.findFirst({
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

    if (viewSetting) {
      const existingFields = viewSetting.columns.map((c) => c.field);
      const allDefaultColumns = [
        { field: 'id', label: 'ID', visible: true },
        { field: 'name', label: 'Name', visible: true },
        { field: 'email', label: 'Email', visible: true },
        { field: 'phone', label: 'Phone', visible: true },
        { field: 'role', label: 'Role', visible: true },
        { field: 'status', label: 'Status', visible: true },
        { field: 'accessLevel', label: 'Access Level', visible: true },
        { field: 'bio', label: 'Bio', visible: false },
        { field: 'country', label: 'Country', visible: false },
        { field: 'city', label: 'City', visible: false },
        { field: 'pincode', label: 'Pincode', visible: false },
        { field: 'tax_id', label: 'Tax ID', visible: false },
        { field: 'facebookLink', label: 'Facebook Link', visible: false },
        { field: 'twitterLink', label: 'Twitter Link', visible: false },
        { field: 'linkdinLink', label: 'LinkedIn Link', visible: false },
        { field: 'instagramLink', label: 'Instagram Link', visible: false },
        { field: 'websiteLink', label: 'Website Link', visible: false },
        { field: 'createdAt', label: 'Created At', visible: false },
        { field: 'action', label: 'Action', visible: true },
      ];

      const missingColumns = allDefaultColumns.filter(
        (c) => !existingFields.includes(c.field),
      );

      if (missingColumns.length > 0) {
        const maxOrder = Math.max(...viewSetting.columns.map((c) => c.order), 0);
        await this.prisma.tableColumn.createMany({
          data: missingColumns.map((col, index) => ({
            tableViewId: viewSetting!.id,
            field: col.field,
            label: col.label,
            visible: col.visible,
            order: maxOrder + index + 1,
          })),
        });

        // Refetch synced settings
        viewSetting = await this.prisma.userTableView.findFirst({
          where: { id: viewSetting.id },
          include: { columns: true },
        });
      }
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
