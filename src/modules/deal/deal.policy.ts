import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DEAL_MODULE_ID } from 'src/seeders/module.seeder';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class DealPolicy {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  private async hasPermission(
    currentUser: any,
    action: 'canView' | 'canCreate' | 'canEdit' | 'canDelete',
  ) {
    const isAllow = await this.paymentsService.isAllowedModules(currentUser.id, DEAL_MODULE_ID);
    if (!isAllow) {
      throw new ForbiddenException(`You are not allowed to ${action} deal`);
    }
    const permission = await this.prisma.rolePermission.findFirst({
      where: {
        roleId: currentUser.roleId,
        moduleId: DEAL_MODULE_ID,
        isAllow: true,
        [action]: true,
      },
    });
    return !!permission;
  }

  private async getRootUserId(userId: number): Promise<number> {
    let user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        parentId: true,
      },
    });

    while (user?.parentId) {
      user = await this.prisma.user.findUnique({
        where: {
          id: user.parentId,
        },
        select: {
          id: true,
          parentId: true,
        },
      });
    }
    return user!.id;
  }

  private async getAccessibleUserIds(userId: number): Promise<number[]> {
    const rootId = await this.getRootUserId(userId);

    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        parentId: true,
      },
    });

    const allowedIds = [rootId];

    const collectChildren = (parentId: number) => {
      const children = users.filter((u) => u.parentId === parentId);

      for (const child of children) {
        allowedIds.push(child.id);
        collectChildren(child.id);
      }
    };

    collectChildren(rootId);

    return [...new Set(allowedIds)];
  }

  private async canAccessDeal(currentUser: any, dealId: number) {
    const deal = await this.prisma.deal.findUnique({
      where: {
        id: dealId,
      },
      select: {
        createdById: true,
        ownerId: true,
      },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { accessLevel: true },
    });

    if (dbUser?.accessLevel === 'STANDARD') {
      return deal.ownerId === currentUser.id;
    }

    const allowedUsers = await this.getAccessibleUserIds(currentUser.id);

    return (
      allowedUsers.includes(deal.createdById) ||
      (deal.ownerId !== null && allowedUsers.includes(deal.ownerId))
    );
  }

  async canViewAll(currentUser: any) {
    return this.hasPermission(currentUser, 'canView');
  }

  async canView(currentUser: any, dealId: number) {
    const allowed = await this.hasPermission(currentUser, 'canView');
    if (!allowed) {
      return false;
    }

    return this.canAccessDeal(currentUser, dealId);
  }

  async canCreate(currentUser: any) {
    return this.hasPermission(currentUser, 'canCreate');
  }

  async canUpdate(currentUser: any, dealId: number) {
    const allowed = await this.hasPermission(currentUser, 'canEdit');

    if (!allowed) {
      return false;
    }

    return this.canAccessDeal(currentUser, dealId);
  }

  async canDelete(currentUser: any, dealId: number) {
    const allowed = await this.hasPermission(currentUser, 'canDelete');

    if (!allowed) {
      return false;
    }

    return this.canAccessDeal(currentUser, dealId);
  }

  async getDealScope(currentUser: any) {
    return this.getAccessibleUserIds(currentUser.id);
  }

  async authorize(
    currentUser: any,
    action: 'view' | 'viewAll' | 'create' | 'update' | 'delete',
    dealId?: number,
  ) {
    let allowed = false;

    switch (action) {
      case 'viewAll':
        allowed = await this.canViewAll(currentUser);
        break;

      case 'view':
        allowed = await this.canView(currentUser, dealId!);
        break;

      case 'create':
        allowed = await this.canCreate(currentUser);
        break;

      case 'update':
        allowed = await this.canUpdate(currentUser, dealId!);
        break;

      case 'delete':
        allowed = await this.canDelete(currentUser, dealId!);
        break;
    }

    if (!allowed) {
      throw new ForbiddenException(`You are not allowed to ${action} deal`);
    }

    return true;
  }
}
