import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PAYMENT_MODULE_ID } from 'src/seeders/module.seeder';
import { UserType } from '@prisma/client';

@Injectable()
export class PaymentPolicy {
  constructor(private readonly prisma: PrismaService) {}

  private async hasPermission(
    roleId: number,
    action: 'canView' | 'canCreate' | 'canEdit' | 'canDelete',
  ) {
    const permission = await this.prisma.rolePermission.findFirst({
      where: {
        roleId,
        moduleId: PAYMENT_MODULE_ID,
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

  private async canAccessPayment(currentUser: any, paymentId: number) {
    const payment = await this.prisma.payment.findUnique({
      where: {
        id: paymentId,
      },
      select: {
        userId: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const allowedUsers = await this.getAccessibleUserIds(currentUser.id);

    return (
      allowedUsers.includes(payment.userId)
    );
  }

  async canViewAll(currentUser: any) {
    return this.hasPermission(currentUser.roleId, 'canView');
  }

  async canView(currentUser: any, paymentId: number) {
    const allowed = await this.hasPermission(currentUser.roleId, 'canView');

    if (!allowed) {
      return false;
    }

    return this.canAccessPayment(currentUser, paymentId);
  }

  async getPaymentScope(currentUser: any) {
    return this.getAccessibleUserIds(currentUser.id);
  }

  async authorize(
    currentUser: any,
    action: 'view' | 'viewAll' | 'create' | 'update' | 'delete',
    paymentId?: number,
  ) {
    let allowed = false;
    if (currentUser.userType == UserType.ADMIN) {
      return true
    }
    switch (action) {
      case 'viewAll':
        allowed = await this.canViewAll(currentUser);
        break;

      case 'view':
        allowed = await this.canView(currentUser, paymentId!);
        break;
    }

    if (!allowed) {
      throw new ForbiddenException(`You are not allowed to ${action} payment`);
    }

    return true;
  }
}
