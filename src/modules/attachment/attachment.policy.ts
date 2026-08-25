import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ATTACHMENT_MODULE_ID } from 'src/seeders/module.seeder';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class AttachmentPolicy {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  private async hasPermission(
    currentUser: any,
    action: 'canView' | 'canCreate' | 'canEdit' | 'canDelete',
  ) {
    const isAllow = await this.paymentsService.isAllowedModules(currentUser.id, ATTACHMENT_MODULE_ID);
    if (!isAllow) {
      throw new ForbiddenException(`You are not allowed to ${action} attachment`);
    }
    const permission = await this.prisma.rolePermission.findFirst({
      where: {
        roleId: currentUser.roleId,
        moduleId: ATTACHMENT_MODULE_ID,
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

  private async canAccessAttachment(currentUser: any, attachmentId: number) {
    const attachment = await this.prisma.attachment.findUnique({
      where: {
        id: attachmentId,
      },
      select: {
        createdById: true,
      },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    const allowedUsers = await this.getAccessibleUserIds(currentUser.id);

    return allowedUsers.includes(attachment.createdById);
  }

  async canViewAll(currentUser: any) {
    return this.hasPermission(currentUser, 'canView');
  }

  async canView(currentUser: any, attachmentId: number) {
    const allowed = await this.hasPermission(currentUser, 'canView');

    if (!allowed) {
      return false;
    }

    return this.canAccessAttachment(currentUser, attachmentId);
  }

  async canCreate(currentUser: any) {
    return this.hasPermission(currentUser, 'canCreate');
  }

  async canUpdate(currentUser: any, attachmentId: number) {
    const allowed = await this.hasPermission(currentUser, 'canEdit');

    if (!allowed) {
      return false;
    }

    return this.canAccessAttachment(currentUser, attachmentId);
  }

  async canDelete(currentUser: any, attachmentId: number) {
    const allowed = await this.hasPermission(currentUser, 'canDelete');

    if (!allowed) {
      return false;
    }

    return this.canAccessAttachment(currentUser, attachmentId);
  }

  async authorize(
    currentUser: any,
    action: 'view' | 'viewAll' | 'create' | 'update' | 'delete',
    attachmentId?: number,
  ) {
    let allowed = false;

    switch (action) {
      case 'viewAll':
        allowed = await this.canViewAll(currentUser);
        break;

      case 'view':
        allowed = await this.canView(currentUser, attachmentId!);
        break;

      case 'create':
        allowed = await this.canCreate(currentUser);
        break;

      case 'update':
        allowed = await this.canUpdate(currentUser, attachmentId!);
        break;

      case 'delete':
        allowed = await this.canDelete(currentUser, attachmentId!);
        break;
    }

    if (!allowed) {
      throw new ForbiddenException(`You are not allowed to ${action} attachment`);
    }

    return true;
  }
}
