import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { USER_MODULE_ID } from 'src/seeders/module.seeder';
import { UserType } from '@prisma/client';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class UserPolicy {
    constructor(
      private readonly prisma: PrismaService,
      @Inject(forwardRef(() => PaymentsService))
      private readonly paymentsService: PaymentsService,
    ) {}

    private async hasPermission(currentUser: any, action: 'canView' | 'canCreate' | 'canEdit' | 'canDelete') {
      const isAllow = await this.paymentsService.isAllowedModules(currentUser.id, USER_MODULE_ID);
      if (!isAllow) {
        throw new ForbiddenException(`You are not allowed to ${action} user`);
      }
      const permission = await this.prisma.rolePermission.findFirst({
        where: {
          roleId: currentUser.roleId,
          moduleId: USER_MODULE_ID,
          isAllow: true,
          [action]: true,
        },
      });

      return !!permission;
    }

    async getAccessibleUserIds(
        currentUserId: number,
    ): Promise<number[]> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        parentId: true,
      },
    });

    const accessibleIds = new Set<number>();

    const collectParents = (
        userId: number,
    ) => {
      const user = users.find(
          (u) => u.id === userId,
      );

      if (!user) {
        return;
      }

      accessibleIds.add(user.id);

      if (user.parentId) {
        collectParents(user.parentId);
      }
    };

    const collectChildren = (parentId: number) => {
      const children = users.filter((u) => u.parentId === parentId);

      for (const child of children) {
        accessibleIds.add(child.id);

        collectChildren(child.id);
      }
    };

    // Collect all ancestors
    collectParents(currentUserId);

    // Expand children for every collected parent
    for (const id of [...accessibleIds]) {
      collectChildren(id);
    }

    return [...accessibleIds];
  }

  private async canAccessUser(currentUser: any, targetUserId: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: targetUserId,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const allowedIds = await this.getAccessibleUserIds(currentUser.id);

    return allowedIds.includes(targetUserId);
  }

  async canView(currentUser: any, userId?: number) {
    const allowed = await this.hasPermission(currentUser, 'canView');

    if (!allowed) {
      return false;
    }

    if (!userId) {
      return true;
    }

    return this.canAccessUser(currentUser, userId);
  }

  async canCreate(currentUser: any) {
    return this.hasPermission(currentUser, 'canCreate');
  }

  async canUpdate(currentUser: any, userId: number) {
    const allowed = await this.hasPermission(currentUser, 'canEdit');

    if (!allowed) {
      return false;
    }

    return this.canAccessUser(currentUser, userId);
  }

  async canDelete(currentUser: any, userId: number) {
    const allowed = await this.hasPermission(currentUser, 'canDelete');

    if (!allowed) {
      return false;
    }

    return this.canAccessUser(currentUser, userId);
  }

  async authorize(
    currentUser: any,
    action: 'view' | 'create' | 'update' | 'delete',
    userId?: number,
  ) {
    let allowed = false;
    if (currentUser.userType == UserType.ADMIN) {
      return true
    }
    switch (action) {
      case 'view':
        allowed = await this.canView(currentUser, userId);
        break;

      case 'create':
        allowed = await this.canCreate(currentUser);
        break;

      case 'update':
        allowed = await this.canUpdate(currentUser, userId!);
        break;

      case 'delete':
        allowed = await this.canDelete(currentUser, userId!);
        break;
    }

    if (!allowed) {
      throw new ForbiddenException(`You are not allowed to ${action} user`);
    }

    return true;
  }
}
