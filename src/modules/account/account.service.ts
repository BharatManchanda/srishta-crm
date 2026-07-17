import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountFilterDto } from './dto/account-filter.dto';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { AccountFilterBuilder } from './account-filter.builder';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { UpdateViewSettingDto } from './dto/account-view-setting.dto';
import { AccountCreateDto } from './dto/account-create.dto';
import { AccountUpdateDto } from './dto/account-update.dto';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly accountFilterBuilder: AccountFilterBuilder,
    private readonly userHierarchyService: UserHierarchyService,
    private readonly activityService: ActivityService,
  ) {}

  async getList(dto: AccountFilterDto, currentUserId: number) {
    const orderBy = dto.sortBy
      ? { [dto.sortBy]: dto.sortOrder || 'desc' }
      : { id: 'desc' };

    const result = await this.paginationService.paginate(this.prisma.account, {
      page: dto.page,
      perPage: dto.perPage,
      where: {
        ...this.accountFilterBuilder.build(dto),
        createdById: {
          in: await this.userHierarchyService.getFamilyUserIds(currentUserId),
        },
        id: {
          in: dto.id !== undefined && dto.id ? [dto.id] : undefined,
        },
      },
      include: {
        billingAddress: true,
        shippingAddress: true,
        parentAccount: true,
      },
      orderBy,
    });

    const accountIds = result.data.map((account: any) => account.id);
    if (accountIds.length > 0) {
      const [tasks, calls, meetings] = await Promise.all([
        this.prisma.task.findMany({
          where: {
            entityType: 'ACCOUNT',
            entityId: { in: accountIds },
            status: { not: 'COMPLETED' },
          },
        }),
        this.prisma.call.findMany({
          where: {
            entityType: 'ACCOUNT',
            entityId: { in: accountIds },
            status: { not: 'COMPLETED' },
          },
        }),
        this.prisma.meeting.findMany({
          where: {
            entityType: 'ACCOUNT',
            entityId: { in: accountIds },
            endTime: { gte: new Date() },
          },
        }),
      ]);

      result.data = result.data.map((account: any) => {
        const accountTasks = tasks.filter((t) => t.entityId === account.id);
        const accountCalls = calls.filter((c) => c.entityId === account.id);
        const accountMeetings = meetings.filter((m) => m.entityId === account.id);

        return {
          ...account,
          openActivities: {
            tasks: accountTasks,
            calls: accountCalls,
            meetings: accountMeetings,
          },
        };
      });
    }

    return result;
  }

  async viewSetting(authUserId: number) {
    const accountModule = await this.prisma.module.findFirst({
      where: {
        path: '/accounts',
      },
    });
    if (!accountModule) return;
    const viewSetting = await this.prisma.userTableView.findFirst({
      where: {
        userId: authUserId,
        isDefault: true,
        moduleId: accountModule.id,
      },
      include: {
        columns: true,
      },
    });

    if (!viewSetting) {
      await this.createDefaultAccountView(authUserId);
      return this.prisma.userTableView.findFirst({
        where: {
          userId: authUserId,
          isDefault: true,
          moduleId: accountModule.id,
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
      dto.columns.map((column) =>
        this.prisma.tableColumn.update({
          where: {
            id: column.id,
          },
          data: {
            visible: column.visible,
          },
        }),
      ),
    );

    return updatedColumns;
  }

  async createDefaultAccountView(userId: number) {
    const accountModule = await this.prisma.module.findUnique({
      where: {
        path: '/accounts',
      },
    });
    if (!accountModule) return;
    await this.prisma.userTableView.create({
      data: {
        userId: userId,
        moduleId: accountModule.id,
        name: 'Default',
        isDefault: true,
        columns: {
          create: [
            { field: 'id', label: 'ID', visible: true, order: 1 },
            {
              field: 'createdById',
              label: 'Created By',
              visible: false,
              order: 2,
            },
            {
              field: 'accountName',
              label: 'Account Name',
              visible: true,
              order: 3,
            },
            {
              field: 'accountSite',
              label: 'Account Site',
              visible: true,
              order: 4,
            },
            {
              field: 'parentAccountId',
              label: 'Parent Account',
              visible: false,
              order: 5,
            },
            {
              field: 'accountNumber',
              label: 'Account Number',
              visible: true,
              order: 6,
            },
            {
              field: 'accountType',
              label: 'Account Type',
              visible: true,
              order: 7,
            },
            { field: 'industry', label: 'Industry', visible: true, order: 8 },
            {
              field: 'annualRevenue',
              label: 'Annual Revenue',
              visible: false,
              order: 9,
            },
            { field: 'rating', label: 'Rating', visible: false, order: 10 },
            { field: 'phone', label: 'Phone', visible: true, order: 11 },
            { field: 'fax', label: 'Fax', visible: false, order: 12 },
            { field: 'website', label: 'Website', visible: false, order: 13 },
            {
              field: 'tickerSymbol',
              label: 'Ticker Symbol',
              visible: false,
              order: 14,
            },
            {
              field: 'ownership',
              label: 'Ownership',
              visible: false,
              order: 15,
            },
            {
              field: 'employees',
              label: 'Employees',
              visible: false,
              order: 16,
            },
            { field: 'sicCode', label: 'SIC Code', visible: false, order: 17 },
            {
              field: 'billingAddress.country',
              label: 'Billing Country',
              visible: false,
              order: 18,
            },
            {
              field: 'billingAddress.city',
              label: 'Billing City',
              visible: true,
              order: 19,
            },
            {
              field: 'billingAddress.stateProvince',
              label: 'Billing State',
              visible: false,
              order: 20,
            },
            {
              field: 'billingAddress.postalCode',
              label: 'Billing Postal Code',
              visible: false,
              order: 21,
            },
            {
              field: 'billingAddress.streetAddress',
              label: 'Billing Address',
              visible: false,
              order: 22,
            },
            {
              field: 'shippingAddress.country',
              label: 'Shipping Country',
              visible: false,
              order: 23,
            },
            {
              field: 'shippingAddress.city',
              label: 'Shipping City',
              visible: false,
              order: 24,
            },
            {
              field: 'shippingAddress.stateProvince',
              label: 'Shipping State',
              visible: false,
              order: 25,
            },
            {
              field: 'shippingAddress.postalCode',
              label: 'Shipping Postal Code',
              visible: false,
              order: 26,
            },
            {
              field: 'shippingAddress.streetAddress',
              label: 'Shipping Address',
              visible: false,
              order: 27,
            },
            {
              field: 'description',
              label: 'Description',
              visible: false,
              order: 28,
            },
            {
              field: 'createdAt',
              label: 'Created At',
              visible: false,
              order: 29,
            },
            {
              field: 'updatedAt',
              label: 'Updated At',
              visible: false,
              order: 30,
            },
            { field: 'openActivity', label: 'Open Activity', visible: true, order: 31 },
            { field: 'action', label: 'Action', visible: true, order: 32 },
          ],
        },
      },
    });
  }

  async get(id: number) {
    return await this.prisma.account.findFirst({
      where: {
        id: id,
      },
      include: {
        billingAddress: true,
        shippingAddress: true,
        parentAccount: true,
        childAccounts: true,
      },
    });
  }

  async create(dto: AccountCreateDto, authUserId: number) {
    try {
      const { billingAddress, shippingAddress, ...accountData } = dto;

      if (dto.parentAccountId !== null) {
        const existingAccount = await this.prisma.account.findFirst({
          where: {
            id: dto.parentAccountId,
          },
        })
        if (!existingAccount){
          throw new BadRequestException('Parent account not found');
        }
      }
      const [billingAddressRecord, shippingAddressRecord] = await Promise.all([
        billingAddress ? this.prisma.address.create({ data: billingAddress }) : null,
        shippingAddress ? this.prisma.address.create({ data: shippingAddress }) : null,
      ]);

      const newAccount = await this.prisma.account.create({
        data: {
          ...accountData,
          createdById: authUserId,
          billingAddressId: billingAddressRecord?.id,
          shippingAddressId: shippingAddressRecord?.id,
        },
      });

      await this.activityService.create({
        entityType: 'ACCOUNT',
        entityId: newAccount.id,
        action: 'ACCOUNT_CREATED',
        description: `Account "${newAccount.accountName}" was created.`,
      }, authUserId);

      return newAccount;
    } catch (error) {
      console.log(error, '::::error');
      throw error;
    }
  }

  async update(id: number, dto: AccountUpdateDto, authUserId: number) {
    try {
      const { billingAddress, shippingAddress, ...accountData } = dto;

      const oldAccount = await this.prisma.account.findUnique({
        where: { id },
        include: {
          billingAddress: true,
          shippingAddress: true,
        },
      });

      if (!oldAccount) {
        throw new NotFoundException('Account not found');
      }

      // Update or create billing address
      let billingAddressId = oldAccount.billingAddressId;
      if (billingAddress) {
        if (billingAddressId) {
          await this.prisma.address.update({
            where: { id: billingAddressId },
            data: billingAddress,
          });
        } else {
          const newAddress = await this.prisma.address.create({
            data: billingAddress,
          });
          billingAddressId = newAddress.id;
        }
      }

      // Update or create shipping address
      let shippingAddressId = oldAccount.shippingAddressId;
      if (shippingAddress) {
        if (shippingAddressId) {
          await this.prisma.address.update({
            where: { id: shippingAddressId },
            data: shippingAddress,
          });
        } else {
          const newAddress = await this.prisma.address.create({
            data: shippingAddress,
          });
          shippingAddressId = newAddress.id;
        }
      }

      await this.prisma.account.update({
        where: { id },
        data: {
          ...accountData,
          billingAddressId,
          shippingAddressId,
        },
      });

      // Fetch updated account with addresses
      const updatedAccount = await this.prisma.account.findUnique({
        where: { id },
        include: {
          billingAddress: true,
          shippingAddress: true,
        },
      });

      if (!updatedAccount) {
        throw new NotFoundException('Account not found');
      }

      await this.activityService.create(
        {
          entityType: 'ACCOUNT',
          entityId: id,
          action: 'ACCOUNT_UPDATED',
          description: `Account "${updatedAccount.accountName}" was updated.`,
          metadata: {
            before: oldAccount,
            after: updatedAccount,
          },
        },
        authUserId,
      );

      return updatedAccount;
    } catch (error) {
      throw error;
    }
  }

  async delete(id: number, authUserId: number) {
    const existingAccount = await this.prisma.account.findUnique({
      where: { id },
    });

    if (!existingAccount) {
      throw new NotFoundException('Account not found');
    }

    const deletedAccount = await this.prisma.account.delete({
      where: {
        id: id,
      },
    });

    await this.activityService.create({
      entityType: 'ACCOUNT',
      entityId: deletedAccount.id,
      action: 'ACCOUNT_DELETED',
      description: `Account "${deletedAccount.accountName}" was deleted.`,
    }, authUserId);

    return deletedAccount;
  }

  async bulkDelete(ids: number[], authUserId: number) {
    const deletedAccounts: any[] = [];
    for (const id of ids) {
      const deleted = await this.delete(id, authUserId);
      deletedAccounts.push(deleted);
    }
    return deletedAccounts;
  }

  async bulkUpdate(ids: number[], data: any, authUserId: number) {
    const whitelistedKeys = [
      'accountType',
      'rating',
      'ownership',
      'industry',
      'annualRevenue',
      'phone',
      'fax',
      'website',
      'tickerSymbol',
      'description',
    ];

    const cleanData = {};
    for (const key of Object.keys(data)) {
      if (whitelistedKeys.includes(key)) {
        cleanData[key] = data[key];
      }
    }

    const updatedAccounts: any[] = [];
    for (const id of ids) {
      const updated = await this.update(id, cleanData as any, authUserId);
      updatedAccounts.push(updated);
    }
    return updatedAccounts;
  }
}

