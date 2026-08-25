import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ROLE_MODULE_ID } from 'src/seeders/module.seeder';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class RolePolicy {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  private async hasPermission(
    currentUser: any,
    action: 'canView' | 'canCreate' | 'canEdit' | 'canDelete',
  ) {
    const isAllow = await this.paymentsService.isAllowedModules(currentUser.id, ROLE_MODULE_ID);
    if (!isAllow) {
      throw new ForbiddenException(`You are not allowed to ${action} role`);
    }
    const permission = await this.prisma.rolePermission.findFirst({
      where: {
        roleId: currentUser.roleId,
        moduleId: ROLE_MODULE_ID,
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

  private async canAccessRole(currentUser: any, roleId: number) {
    const role = await this.prisma.role.findUnique({
      where: {
        id: roleId,
      },
      select: {
        createdById: true,
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const allowedUsers = await this.getAccessibleUserIds(currentUser.id);

    return allowedUsers.includes(role.createdById);
  }

  async canViewAll(currentUser: any) {
    return this.hasPermission(currentUser, 'canView');
  }

  async canView(currentUser: any, roleId: number) {
    const allowed = await this.hasPermission(currentUser, 'canView');

    if (!allowed) {
      return false;
    }

    return this.canAccessRole(currentUser, roleId);
  }

  async canCreate(currentUser: any) {
    return this.hasPermission(currentUser, 'canCreate');
  }

  async canUpdate(currentUser: any, roleId: number) {
    const allowed = await this.hasPermission(currentUser, 'canEdit');

    if (!allowed) {
      return false;
    }

    return this.canAccessRole(currentUser, roleId);
  }

  async canDelete(currentUser: any, roleId: number) {
    const allowed = await this.hasPermission(currentUser, 'canDelete');

    if (!allowed) {
      return false;
    }

    return this.canAccessRole(currentUser, roleId);
  }

  async getRoleScope(currentUser: any) {
    return this.getAccessibleUserIds(currentUser.id);
  }

  async authorize(
    currentUser: any,
    action: 'view' | 'viewAll' | 'create' | 'update' | 'delete',
    roleId?: number,
  ) {
    let allowed = false;

    switch (action) {
      case 'viewAll':
        allowed = await this.canViewAll(currentUser);
        break;

      case 'view':
        allowed = await this.canView(currentUser, roleId!);
        break;

      case 'create':
        allowed = await this.canCreate(currentUser);
        break;

      case 'update':
        allowed = await this.canUpdate(currentUser, roleId!);
        break;

      case 'delete':
        allowed = await this.canDelete(currentUser, roleId!);
        break;
    }

    if (!allowed) {
      throw new ForbiddenException(`You are not allowed to ${action} role`);
    }

    return true;
  }
}
