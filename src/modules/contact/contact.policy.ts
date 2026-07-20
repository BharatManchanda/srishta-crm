import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CONTACT_MODULE_ID } from 'src/seeders/module.seeder';

@Injectable()
export class ContactPolicy {
  constructor(private readonly prisma: PrismaService) {}

  private async hasPermission(
    roleId: number,
    action: 'canView' | 'canCreate' | 'canEdit' | 'canDelete',
  ) {
    const permission = await this.prisma.rolePermission.findFirst({
      where: {
        roleId,
        moduleId: CONTACT_MODULE_ID,
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

  private async canAccessContact(currentUser: any, contactId: number) {
    const contact = await this.prisma.contact.findUnique({
      where: {
        id: contactId,
      },
      select: {
        createdById: true,
        ownerId: true,
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { accessLevel: true },
    });

    if (dbUser?.accessLevel === 'STANDARD') {
      return contact.ownerId === currentUser.id;
    }

    const allowedUsers = await this.getAccessibleUserIds(currentUser.id);

    return (
      allowedUsers.includes(contact.createdById) ||
      (contact.ownerId !== null && allowedUsers.includes(contact.ownerId))
    );
  }

  async canViewAll(currentUser: any) {
    return this.hasPermission(currentUser.roleId, 'canView');
  }

  async canView(currentUser: any, contactId: number) {
    const allowed = await this.hasPermission(currentUser.roleId, 'canView');

    if (!allowed) {
      return false;
    }

    return this.canAccessContact(currentUser, contactId);
  }

  async canCreate(currentUser: any) {
    return this.hasPermission(currentUser.roleId, 'canCreate');
  }

  async canUpdate(currentUser: any, contactId: number) {
    const allowed = await this.hasPermission(currentUser.roleId, 'canEdit');

    if (!allowed) {
      return false;
    }

    return this.canAccessContact(currentUser, contactId);
  }

  async canDelete(currentUser: any, contactId: number) {
    const allowed = await this.hasPermission(currentUser.roleId, 'canDelete');

    if (!allowed) {
      return false;
    }

    return this.canAccessContact(currentUser, contactId);
  }

  async getContactScope(currentUser: any) {
    return this.getAccessibleUserIds(currentUser.id);
  }

  async authorize(
    currentUser: any,
    action: 'view' | 'viewAll' | 'create' | 'update' | 'delete',
    contactId?: number,
  ) {
    let allowed = false;

    switch (action) {
      case 'viewAll':
        allowed = await this.canViewAll(currentUser);
        break;

      case 'view':
        allowed = await this.canView(currentUser, contactId!);
        break;

      case 'create':
        allowed = await this.canCreate(currentUser);
        break;

      case 'update':
        allowed = await this.canUpdate(currentUser, contactId!);
        break;

      case 'delete':
        allowed = await this.canDelete(currentUser, contactId!);
        break;
    }

    if (!allowed) {
      throw new ForbiddenException(`You are not allowed to ${action} contact`);
    }

    return true;
  }
}
